import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { default: express } = await import("express");
const { createAuthRouter } = await import("./routes/auth");
const { errorHandler } = await import("./middlewares/error");
const { verifyPassword } = await import("./lib/auth");
const { users } = await import("@workspace/db");

type StoredUser = {
  id: number;
  email: string;
  passwordHash: string;
  role: "candidate";
  name: string;
};

function createFakeDatabase(initialUsers: StoredUser[] = []) {
  const storedUsers = [...initialUsers];
  let nextId = storedUsers.length + 1;

  const database = {
    select: () => ({
      from: () => ({
        where: (_condition: unknown) => ({
          limit: async () => {
            return storedUsers.map((user) => ({ id: user.id }));
          },
        }),
      }),
    }),
    insert: () => ({
      values: (value: Omit<StoredUser, "id">) => ({
        returning: async () => {
          if (storedUsers.some((user) => user.email === value.email)) {
            throw Object.assign(new Error("duplicate email"), { code: "23505" });
          }

          const user = { ...value, id: nextId++ };
          storedUsers.push(user);
          return [{ id: user.id, email: user.email, name: user.name }];
        },
      }),
    }),
  };

  return { database, storedUsers };
}

async function createTestServer(initialUsers: StoredUser[] = []) {
  const fake = createFakeDatabase(initialUsers);
  const app = express();
  app.use(express.json());
  app.use(createAuthRouter(fake.database as never));
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  return {
    fake,
    server,
    url: `http://127.0.0.1:${address.port}/auth/register`,
  };
}

async function postRegistration(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
});

describe("POST /auth/register", () => {
  it("creates a candidate and returns only public user data", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);

    const response = await postRegistration(testServer.url, {
      email: "  USER@example.com ",
      password: "Secure!123",
      name: "User",
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body, {
      message: "User registered successfully",
      user: { id: 1, email: "user@example.com", name: "User" },
    });
    assert.equal("password" in body.user, false);
    assert.equal("passwordHash" in body.user, false);
    assert.equal(testServer.fake.storedUsers.length, 1);
    assert.notEqual(testServer.fake.storedUsers[0].passwordHash, "Secure!123");
    assert.equal(await verifyPassword("Secure!123", testServer.fake.storedUsers[0].passwordHash), true);
  });

  const invalidCases = [
    ["invalid email", { email: "not-an-email", password: "Secure!123", name: "User" }],
    ["short password", { email: "user@example.com", password: "Short!1", name: "User" }],
    ["missing uppercase", { email: "user@example.com", password: "secure!123", name: "User" }],
    ["missing lowercase", { email: "user@example.com", password: "SECURE!123", name: "User" }],
    ["missing number", { email: "user@example.com", password: "Secure!abc", name: "User" }],
    ["missing special character", { email: "user@example.com", password: "Secure123", name: "User" }],
    ["missing required field", { email: "user@example.com", password: "Secure!123" }],
  ] as const;

  for (const [name, body] of invalidCases) {
    it(`rejects ${name}`, async () => {
      const testServer = await createTestServer();
      servers.push(testServer.server);

      const response = await postRegistration(testServer.url, body);

      assert.equal(response.status, 400);
      assert.equal(testServer.fake.storedUsers.length, 0);
    });
  }

  it("rejects duplicate emails without exposing database details", async () => {
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash: "hash", role: "candidate", name: "Existing" },
    ]);
    servers.push(testServer.server);

    const response = await postRegistration(testServer.url, {
      email: "USER@example.com",
      password: "Secure!123",
      name: "User",
    });
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.deepEqual(body, { error: { message: "An account with that email already exists" } });
    assert.equal(JSON.stringify(body).includes("duplicate email"), false);
  });
});