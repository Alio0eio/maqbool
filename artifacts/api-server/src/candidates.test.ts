import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import express from "express";
import { afterEach, describe, it } from "node:test";
import type { ResumeStorage } from "./lib/resume-storage";
import type { ResumeTextReader } from "./lib/resume-import";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { candidateProfiles, users } = await import("@workspace/db");
const { createCandidatesRouter } = await import("./routes/candidates");
const { errorHandler } = await import("./middlewares/error");
const { generateAccessToken } = await import("./lib/auth");
const { extractResumeProfile } = await import("./lib/resume-import");

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
  headline?: string | null;
  location: string | null;
  education: string | null;
  experience: string | null;
  skills: string[];
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  summary?: string | null;
  yearsOfExperience?: string | null;
  availability?: string | null;
  salaryExpectation?: number | null;
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
  resumeStorage: ResumeStorage = {
    upload: async () => "00000000-0000-0000-0000-000000000000.pdf",
    download: async () => ({ body: new Uint8Array(), contentType: "application/pdf" }),
  },
  resumeTextReader: ResumeTextReader = async () => "",
) {
  const fake = createFakeDatabase(initialUsers, initialProfiles);
  const app = express();
  app.use(express.json());
  app.use(createCandidatesRouter(fake.database as never, resumeStorage, resumeTextReader));
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
      headline: "Product designer",
      location: "Cairo, Egypt",
      education: "BSc Computer Science",
      experience: "Data Analysis Intern",
      skills: ["SQL", "Power BI", "Python"],
      yearsOfExperience: 4,
      portfolioUrl: "https://example.com/portfolio",
      linkedinUrl: "https://linkedin.com/in/candidate",
      githubUrl: "https://github.com/candidate",
      summary: "Candidate profile summary",
      availability: "Immediately",
    });

    const created = (await createResponse.json()) as Record<string, unknown>;

    assert.equal(createResponse.status, 201);
    assert.equal(created.userId, candidate.id);
    assert.equal(created.name, candidate.name);
    assert.equal(created.email, candidate.email);
    assert.deepEqual(created.skills, ["SQL", "Power BI", "Python"]);
    assert.equal(created.headline, "Product designer");
    assert.equal(created.yearsOfExp, 4);
    assert.equal(created.portfolioUrl, "https://example.com/portfolio");
    assert.equal(created.linkedinUrl, "https://linkedin.com/in/candidate");
    assert.equal(created.githubUrl, "https://github.com/candidate");
    assert.equal(created.summary, "Candidate profile summary");
    assert.equal(created.availability, "Immediately");

    const getResponse = await request(profileUrl, "GET", token);
    assert.equal(getResponse.status, 200);
    const retrieved = (await getResponse.json()) as Record<string, unknown>;
    assert.equal(retrieved.location, "Cairo, Egypt");
    assert.equal(retrieved.headline, "Product designer");
    assert.equal(retrieved.email, candidate.email);
    assert.equal(retrieved.yearsOfExp, 4);

    const updateResponse = await request(profileUrl, "PUT", token, {
      headline: "Senior product designer",
      location: "Alexandria, Egypt",
      skills: ["TypeScript"],
      summary: "Updated summary",
      githubUrl: null,
    });
    const updated = (await updateResponse.json()) as Record<string, unknown>;
    assert.equal(updateResponse.status, 200);
    assert.equal(updated.location, "Alexandria, Egypt");
    assert.deepEqual(updated.skills, ["TypeScript"]);
    assert.equal(updated.phone, "01012345678");
    assert.equal(updated.headline, "Senior product designer");
    assert.equal(updated.summary, "Updated summary");
    assert.equal(updated.githubUrl, null);
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

describe("candidate resume import", () => {
  it("stores the authenticated candidate's resume and extracts profile fields", async () => {
    const profile: TestProfile = {
      id: 11,
      userId: candidate.id,
      phone: null,
      location: null,
      education: null,
      experience: null,
      skills: [],
      resumeUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let storedUserId: number | null = null;
    const storage: ResumeStorage = {
      async upload(userId) {
        storedUserId = userId;
        return "00000000-0000-0000-0000-000000000001.pdf";
      },
      async download(userId) {
        if (userId !== candidate.id) {
          throw Object.assign(new Error("Resume not found"), { statusCode: 404 });
        }
        return { body: new Uint8Array([1, 2, 3]), contentType: "application/pdf" };
      },
    };
    const reader: ResumeTextReader = async () =>
      "Phone: +1 555 222 3333\nLocation: Cairo, Egypt\n5 years experience\nSUMMARY\nExperienced engineer\nEXPERIENCE\nBuilt APIs\nEDUCATION\nBSc Computer Science\nSKILLS\nTypeScript, PostgreSQL";
    const testServer = await createTestServer([candidate], [profile], storage, reader);
    servers.push(testServer.server);
    const formData = new FormData();
    formData.set("resume", new Blob(["%PDF-fake-pdf-content"], { type: "application/pdf" }), "resume.pdf");

    const response = await fetch(`${testServer.url}/candidates/profile/resume`, {
      method: "POST",
      headers: { authorization: `Bearer ${tokenFor(candidate)}` },
      body: formData,
    });
    const body = await response.json() as {
      resumeUrl: string;
      extractedFields: Record<string, unknown>;
    };

    assert.equal(response.status, 200);
    assert.equal(storedUserId, candidate.id);
    assert.equal(body.resumeUrl, "/api/candidates/profile/resume/00000000-0000-0000-0000-000000000001.pdf");
    assert.equal(testServer.fake.storedProfiles[0].resumeUrl, body.resumeUrl);
    assert.equal(body.extractedFields.phone, "+1 555 222 3333");
    assert.equal(body.extractedFields.location, "Cairo, Egypt");
    assert.equal(body.extractedFields.experience, "Built APIs");
    assert.equal(body.extractedFields.education, "BSc Computer Science");
    assert.deepEqual(body.extractedFields.skills, ["TypeScript", "PostgreSQL"]);
    assert.equal(body.extractedFields.yearsOfExperience, 5);

    const downloadResponse = await fetch(`${testServer.url}${body.resumeUrl.replace(/^\/api/, "")}`, {
      headers: { authorization: `Bearer ${tokenFor(candidate)}` },
    });
    assert.equal(downloadResponse.status, 200);
    assert.equal(downloadResponse.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(new Uint8Array(await downloadResponse.arrayBuffer()), new Uint8Array([1, 2, 3]));

    const otherCandidate = { ...candidate, id: 3, email: "other@example.com" };
    const forbiddenDownload = await fetch(`${testServer.url}${body.resumeUrl.replace(/^\/api/, "")}`, {
      headers: { authorization: `Bearer ${tokenFor(otherCandidate)}` },
    });
    assert.equal(forbiddenDownload.status, 404);
  });

  it("requires candidate authentication and rejects non-PDF/DOCX files", async () => {
    const profile: TestProfile = {
      id: 11,
      userId: candidate.id,
      phone: null,
      location: null,
      education: null,
      experience: null,
      skills: [],
      resumeUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const testServer = await createTestServer([candidate, recruiter], [profile]);
    servers.push(testServer.server);
    const url = `${testServer.url}/candidates/profile/resume`;
    const missingAuth = await fetch(url, { method: "POST" });
    assert.equal(missingAuth.status, 401);

    const recruiterResponse = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${tokenFor(recruiter)}` },
    });
    assert.equal(recruiterResponse.status, 403);

    const invalidForm = new FormData();
    invalidForm.set("resume", new Blob(["not a pdf"], { type: "application/pdf" }), "resume.pdf");
    const invalidResponse = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${tokenFor(candidate)}` },
      body: invalidForm,
    });
    assert.equal(invalidResponse.status, 400);
  });

  it("extracts profile fields only from recognizable resume sections", () => {
    assert.deepEqual(extractResumeProfile(
      "Phone: +1 555 222 3333\nSUMMARY\nEngineer\nEDUCATION\nBSc Computer Science\nSKILLS\nTypeScript, SQL",
    ), {
      phone: "+1 555 222 3333",
      summary: "Engineer",
      education: "BSc Computer Science",
      skills: ["TypeScript", "SQL"],
    });
  });
});
