import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import express from "express";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { candidateProfiles, users } = await import("@workspace/db");
const { createCandidatesRouter } = await import("./routes/candidates");
const { errorHandler } = await import("./middlewares/error");
const { generateAccessToken } = await import("./lib/auth");

type TestUser = {
  id: number;
  email: string;
  name: string;
  role: "candidate" | "recruiter";
  avatarUrl: string | null;
};

type TestProfile = {
  id: number;
  userId: number;
  phone: string | null;
  location: string | null;
  education: string | null;
  experience: string | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
};

function createFakeDatabase(initialUsers: TestUser[], initialProfiles: TestProfile[] = []) {
  const storedUsers = initialUsers.map((user) => ({ ...user }));
  const storedProfiles = initialProfiles.map((profile) => ({ ...profile }));
  let nextProfileId = storedProfiles.length + 1;

  const database = {
    select: (selection?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        const builder = {
          innerJoin: (_joinedTable: unknown, _condition: unknown) => builder,
          where: (_condition: unknown) => builder,
          limit: async () => {
            if (table === users) {
              return storedUsers.map((user) =>
                selection ? { id: user.id } : user,
              );
            }

            return storedProfiles.map((profile) => {
              const user = storedUsers.find((candidate) => candidate.id === profile.userId);
              return selection
                ? {
                    ...profile,
                    name: user?.name,
                    email: user?.email,
                    avatarUrl: user?.avatarUrl,
                  }
                : profile;
            });
          },
        };
        return builder;
      },
    }),
    insert: (_table: unknown) => ({
      values: async (value: Omit<TestProfile, "id" | "createdAt" | "updatedAt">) => {
        const now = new Date();
        storedProfiles.push({
          ...value,
          id: nextProfileId++,
          createdAt: now,
          updatedAt: now,
        });
      },
    }),
    update: (_table: unknown) => ({
      set: (values: Partial<TestProfile>) => ({
        where: async (_condition: unknown) => {
          const profile = storedProfiles[0];
          if (profile) {
            Object.assign(profile, values);
          }
        },
      }),
    }),
  };

  return { database, storedProfiles };
}

async function createTestServer(
  initialUsers: TestUser[],
  initialProfiles: TestProfile[] = [],
) {
  const fake = createFakeDatabase(initialUsers, initialProfiles);
  const app = express();
  app.use(express.json());
  app.use(createCandidatesRouter(fake.database as never));
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  return { fake, server, url: `http://127.0.0.1:${address.port}` };
}

function tokenFor(user: TestUser): string {
  return generateAccessToken(user.id, {
    role: user.role,
    email: user.email,
    name: user.name,
  });
}

async function request(
  url: string,
  method: "POST" | "GET" | "PUT",
  token: string | undefined,
  body?: unknown,
) {
  return fetch(url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
});

const candidate: TestUser = {
  id: 1,
  email: "candidate@example.com",
  name: "Candidate",
  role: "candidate",
  avatarUrl: null,
};
const recruiter: TestUser = {
  id: 2,
  email: "recruiter@example.com",
  name: "Recruiter",
  role: "recruiter",
  avatarUrl: null,
};

describe("candidate profile management", () => {
  it("creates, retrieves, and partially updates the authenticated candidate profile", async () => {
    const testServer = await createTestServer([candidate]);
    servers.push(testServer.server);
    const token = tokenFor(candidate);
    const profileUrl = testServer.url + "/candidates/profile";

    const createResponse = await request(profileUrl, "POST", token, {
      phone: "01012345678",
      location: "Cairo, Egypt",
      education: "BSc Computer Science",
      experience: "Data Analysis Intern",
      skills: ["SQL", "Power BI", "Python"],
    });
    const created = (await createResponse.json()) as Record<string, unknown>;

    assert.equal(createResponse.status, 201);
    assert.equal(created.userId, candidate.id);
    assert.equal(created.name, candidate.name);
    assert.equal(created.email, candidate.email);
    assert.deepEqual(created.skills, ["SQL", "Power BI", "Python"]);

    const getResponse = await request(profileUrl, "GET", token);
    assert.equal(getResponse.status, 200);
    const retrieved = (await getResponse.json()) as Record<string, unknown>;
    assert.equal(retrieved.location, "Cairo, Egypt");

    const updateResponse = await request(profileUrl, "PUT", token, {
      location: "Alexandria, Egypt",
      skills: ["TypeScript"],
    });
    const updated = (await updateResponse.json()) as Record<string, unknown>;
    assert.equal(updateResponse.status, 200);
    assert.equal(updated.location, "Alexandria, Egypt");
    assert.deepEqual(updated.skills, ["TypeScript"]);
    assert.equal(updated.phone, "01012345678");
  });

  it("rejects duplicate creation, invalid skills, and ownership fields", async () => {
    const profile: TestProfile = {
      id: 1,
      userId: candidate.id,
      phone: null,
      location: null,
      education: null,
      experience: null,
      skills: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const testServer = await createTestServer([candidate], [profile]);
    servers.push(testServer.server);
    const token = tokenFor(candidate);
    const profileUrl = testServer.url + "/candidates/profile";

    const duplicateResponse = await request(profileUrl, "POST", token, {});
    const invalidSkillsResponse = await request(profileUrl, "PUT", token, {
      skills: "SQL",
    });
    const ownershipResponse = await request(profileUrl, "PUT", token, {
      userId: 999,
      location: "Cairo",
    });

    assert.equal(duplicateResponse.status, 409);
    assert.equal(invalidSkillsResponse.status, 400);
    assert.equal(ownershipResponse.status, 400);
  });

  it("requires authentication and the candidate role", async () => {
    const testServer = await createTestServer([candidate, recruiter]);
    servers.push(testServer.server);
    const profileUrl = testServer.url + "/candidates/profile";

    const unauthenticatedResponse = await request(profileUrl, "GET", undefined);
    const recruiterResponse = await request(profileUrl, "GET", tokenFor(recruiter));

    assert.equal(unauthenticatedResponse.status, 401);
    assert.equal(recruiterResponse.status, 403);
  });

  it("returns not found when the candidate has no profile", async () => {
    const testServer = await createTestServer([candidate]);
    servers.push(testServer.server);
    const profileUrl = testServer.url + "/candidates/profile";

    const getResponse = await request(profileUrl, "GET", tokenFor(candidate));
    const updateResponse = await request(profileUrl, "PUT", tokenFor(candidate), {
      location: "Cairo",
    });

    assert.equal(getResponse.status, 404);
    assert.equal(updateResponse.status, 404);
  });
});
