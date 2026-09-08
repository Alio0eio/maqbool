import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { default: express } = await import("express");
const { default: jwt } = await import("jsonwebtoken");
const { createAuthRouter } = await import("./routes/auth");
const { config } = await import("./config");
const { errorHandler } = await import("./middlewares/error");
const { authenticate } = await import("./middlewares/auth");
const {
  generateRefreshToken,
  verifyAccessToken,
  verifyPassword,
  hashPassword,
} = await import("./lib/auth");
const { clearRevokedTokensForTests, isAccessTokenRevoked, revokeAccessToken } = await import(
  "./lib/token-revocation",
);
const {
  clearRefreshTokensForTests,
  storeRefreshToken,
} = await import("./lib/refresh-token-store");
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
            return storedUsers;
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
  app.get("/protected", authenticate, (_req, res) => {
    res.json({ message: "Access granted" });
  });
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  return {
    fake,
    server,
    url: `http://127.0.0.1:${address.port}`,
  };
}

async function postAuth(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const servers: http.Server[] = [];

afterEach(() => {
  clearRevokedTokensForTests();
  clearRefreshTokensForTests();
  for (const server of servers.splice(0)) {
    server.close();
  }
});

describe("POST /auth/register", () => {
  it("creates a candidate and returns only public user data", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);

    const response = await postAuth(testServer.url + "/auth/register", {
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

      const response = await postAuth(testServer.url + "/auth/register", body);

      assert.equal(response.status, 400);
      assert.equal(testServer.fake.storedUsers.length, 0);
    });
  }

  it("rejects duplicate emails without exposing database details", async () => {
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash: "hash", role: "candidate", name: "Existing" },
    ]);
    servers.push(testServer.server);

    const response = await postAuth(testServer.url + "/auth/register", {
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

describe("POST /auth/login", () => {
  it("returns a JWT and only safe user data for valid credentials", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash, role: "candidate", name: "User" },
    ]);
    servers.push(testServer.server);

    const response = await postAuth(testServer.url + "/auth/login", {
      email: " USER@example.com ",
      password: "Secure!123",
    });
    const body = (await response.json()) as {
      message: string;
      token: string;
      user: Record<string, unknown>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.message, "Login successful");
    assert.equal(typeof body.token, "string");
    assert.equal(verifyAccessToken(body.token).sub, "1");
    assert.deepEqual(body.user, { id: 1, email: "user@example.com", name: "User" });
    assert.equal("password" in body.user, false);
    assert.equal("passwordHash" in body.user, false);
  });

  it("uses the same generic error for nonexistent and incorrect credentials", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const existingUser = { id: 1, email: "user@example.com", passwordHash, role: "candidate" as const, name: "User" };
    const cases = [
      { email: "missing@example.com", password: "Secure!123" },
      { email: "user@example.com", password: "Wrong!123" },
    ];

    for (const credentials of cases) {
      const testServer = await createTestServer(credentials.email.startsWith("missing") ? [] : [existingUser]);
      servers.push(testServer.server);

      const response = await postAuth(testServer.url + "/auth/login", credentials);
      const body = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(body, { error: { message: "Invalid email or password" } });
    }
  });

  const invalidCases = [
    ["invalid email", { email: "not-an-email", password: "Secure!123" }],
    ["missing password", { email: "user@example.com" }],
  ] as const;

  for (const [name, body] of invalidCases) {
    it(`rejects ${name}`, async () => {
      const testServer = await createTestServer();
      servers.push(testServer.server);

      const response = await postAuth(testServer.url + "/auth/login", body);

      assert.equal(response.status, 400);
    });
  }
});

describe("POST /auth/logout", () => {
  it("revokes a valid token and does not expose token data", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash, role: "candidate", name: "User" },
    ]);
    servers.push(testServer.server);

    const loginResponse = await postAuth(testServer.url + "/auth/login", {
      email: "user@example.com",
      password: "Secure!123",
    });
    const { token } = (await loginResponse.json()) as { token: string };
    const logoutResponse = await fetch(testServer.url + "/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await logoutResponse.json();

    assert.equal(logoutResponse.status, 200);
    assert.deepEqual(body, { message: "Logout successful" });
    assert.equal(JSON.stringify(body).includes(token), false);
    assert.equal(isAccessTokenRevoked(verifyAccessToken(token).jti), true);
  });

  it("rejects missing and invalid tokens", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);

    const missingResponse = await fetch(testServer.url + "/auth/logout", { method: "POST" });
    const invalidResponse = await fetch(testServer.url + "/auth/logout", {
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
    });

    assert.equal(missingResponse.status, 401);
    assert.equal(invalidResponse.status, 401);
  });

  it("rejects an already revoked token but accepts a different valid token", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash, role: "candidate", name: "User" },
    ]);
    servers.push(testServer.server);

    const login = async () => {
      const response = await postAuth(testServer.url + "/auth/login", {
        email: "user@example.com",
        password: "Secure!123",
      });
      return (await response.json() as { token: string }).token;
    };
    const revokedToken = await login();
    const validToken = await login();

    await fetch(testServer.url + "/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${revokedToken}` },
    });
    const revokedResponse = await fetch(testServer.url + "/protected", {
      headers: { authorization: `Bearer ${revokedToken}` },
    });
    const validResponse = await fetch(testServer.url + "/protected", {
      headers: { authorization: `Bearer ${validToken}` },
    });

    assert.equal(revokedResponse.status, 401);
    assert.equal(validResponse.status, 200);

    const secondLogoutResponse = await fetch(testServer.url + "/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${revokedToken}` },
    });
    assert.equal(secondLogoutResponse.status, 401);
  });

  it("does not retain revocations past their expiration", () => {
    revokeAccessToken("expired-jti", Date.now() - 1);

    assert.equal(isAccessTokenRevoked("expired-jti"), false);
  });
});

describe("POST /auth/refresh", () => {
  it("rotates a valid refresh token and returns a working access token", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash, role: "candidate", name: "User" },
    ]);
    servers.push(testServer.server);

    const loginResponse = await postAuth(testServer.url + "/auth/login", {
      email: "user@example.com",
      password: "Secure!123",
    });
    const loginBody = (await loginResponse.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const refreshResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: loginBody.refreshToken,
    });
    const refreshBody = (await refreshResponse.json()) as {
      accessToken: string;
      refreshToken: string;
    };

    assert.equal(refreshResponse.status, 200);
    assert.equal(typeof refreshBody.accessToken, "string");
    assert.equal(typeof refreshBody.refreshToken, "string");
    assert.notEqual(refreshBody.accessToken, loginBody.accessToken);
    assert.notEqual(refreshBody.refreshToken, loginBody.refreshToken);

    const protectedResponse = await fetch(testServer.url + "/protected", {
      headers: { authorization: `Bearer ${refreshBody.accessToken}` },
    });
    assert.equal(protectedResponse.status, 200);

    const reusedResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: loginBody.refreshToken,
    });
    assert.equal(reusedResponse.status, 401);
  });

  it("rejects invalid, access, revoked, and nonexistent-user refresh tokens", async () => {
    const passwordHash = await hashPassword("Secure!123");
    const testServer = await createTestServer([
      { id: 1, email: "user@example.com", passwordHash, role: "candidate", name: "User" },
    ]);
    servers.push(testServer.server);

    const loginResponse = await postAuth(testServer.url + "/auth/login", {
      email: "user@example.com",
      password: "Secure!123",
    });
    const loginBody = (await loginResponse.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    const invalidResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: "invalid-token",
    });
    const accessResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: loginBody.accessToken,
    });
    const expiredRefreshToken = jwt.sign(
      { sub: "1", jti: "expired-refresh", type: "refresh" },
      config.jwt.refreshSecret,
      { algorithm: config.jwt.algorithm, expiresIn: -1 },
    );
    const expiredResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: expiredRefreshToken,
    });

    assert.equal(invalidResponse.status, 401);
    assert.equal(accessResponse.status, 401);
    assert.equal(expiredResponse.status, 401);

    const revokedPayload = (await import("./lib/auth")).verifyRefreshToken(
      loginBody.refreshToken,
    );
    storeRefreshToken(revokedPayload.jti, "1", revokedPayload.exp * 1000);
    const logoutResponse = await fetch(testServer.url + "/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${loginBody.accessToken}` },
    });
    assert.equal(logoutResponse.status, 200);

    const revokedResponse = await postAuth(testServer.url + "/auth/refresh", {
      refreshToken: loginBody.refreshToken,
    });
    assert.equal(revokedResponse.status, 401);

    const nonexistentRefreshToken = generateRefreshToken(999);
    const nonexistentPayload = (await import("./lib/auth")).verifyRefreshToken(
      nonexistentRefreshToken,
    );
    storeRefreshToken(
      nonexistentPayload.jti,
      "999",
      nonexistentPayload.exp * 1000,
    );
    const emptyServer = await createTestServer();
    servers.push(emptyServer.server);
    const nonexistentResponse = await postAuth(emptyServer.url + "/auth/refresh", {
      refreshToken: nonexistentRefreshToken,
    });
    assert.equal(nonexistentResponse.status, 401);
  });
});