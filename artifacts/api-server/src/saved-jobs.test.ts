import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import express from "express";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { candidateProfiles, companies, jobs, savedJobs } = await import("@workspace/db");
const { createCandidatesRouter } = await import("./routes/candidates");
const { createJobsRouter } = await import("./routes/jobs");
const { errorHandler } = await import("./middlewares/error");
const { generateAccessToken } = await import("./lib/auth");

type SavedRecord = { id: number; candidateId: number; jobId: number; createdAt: Date };

const job = {
  id: 1,
  title: "Senior TypeScript Engineer",
  companyId: 10,
  company: "Acme",
  companyLogoUrl: null,
  location: "Remote",
  locationType: "remote" as const,
  type: "full_time" as const,
  experienceLevel: "senior",
  salaryMin: 100000,
  salaryMax: 140000,
  salaryCurrency: "USD",
  postedAt: new Date("2026-09-01T00:00:00.000Z"),
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
};

function createFakeDatabase(
  activeUserId: number,
  initialSaved: SavedRecord[] = [],
  options: { jobExists?: boolean } = {},
) {
  const storedSaved = initialSaved.map((saved) => ({ ...saved }));
  let nextId = storedSaved.length + 1;
  const activeCandidate = { id: activeUserId * 10, userId: activeUserId };
  const database = {
    select: (selection: Record<string, unknown>) => ({
      from: (table: unknown) => {
        if ("count" in selection) {
          return {
            where: async () => [{ count: String(storedSaved.filter((saved) => saved.candidateId === activeCandidate.id).length) }],
          };
        }

        const builder = {
          innerJoin: () => builder,
          where: () => builder,
          limit: (value?: number) => {
            if (table === savedJobs && "job" in selection) {
              return {
                offset: async () => storedSaved
                  .filter((saved) => saved.candidateId === activeCandidate.id)
                  .map((saved) => ({
                    id: saved.id,
                    jobId: job.id,
                    savedAt: saved.createdAt,
                    job,
                  })),
              };
            }

            return (async () => {
            if (table === candidateProfiles) return [activeCandidate];
            if (table === jobs) return options.jobExists === false ? [] : [{ id: job.id }];
            if (table === savedJobs) {
              const saved = storedSaved.find(
                (item) => item.candidateId === activeCandidate.id && item.jobId === job.id,
              );
              return saved ? [{ id: saved.id }] : [];
            }
            return [];
            })();
          },
          orderBy: () => builder,
        };
        return builder;
      },
    }),
    insert: () => ({
      values: (value: { candidateId: number; jobId: number }) => ({
        returning: async () => {
          const saved = { ...value, id: nextId++, createdAt: new Date() };
          storedSaved.push(saved);
          return [{ id: saved.id, jobId: saved.jobId, savedAt: saved.createdAt }];
        },
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: async () => {
          const index = storedSaved.findIndex(
            (item) => item.candidateId === activeCandidate.id && item.jobId === job.id,
          );
          if (index < 0) return [];
          const [deleted] = storedSaved.splice(index, 1);
          return [{ id: deleted.id }];
        },
      }),
    }),
  };

  return { database, storedSaved };
}

async function createTestServer(
  userId = 1,
  initialSaved: SavedRecord[] = [],
  options: { jobExists?: boolean } = {},
) {
  const fake = createFakeDatabase(userId, initialSaved, options);
  const app = express();
  app.use(express.json());
  app.use(createJobsRouter(fake.database as never));
  app.use(createCandidatesRouter(fake.database as never));
  app.use(errorHandler);
  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { fake, server, url: `http://127.0.0.1:${address.port}` };
}

function tokenFor(userId: number, role: "candidate" | "recruiter" = "candidate") {
  return generateAccessToken(userId, { role });
}

async function request(url: string, method: "POST" | "DELETE" | "GET", token?: string, body?: unknown) {
  return fetch(url, {
    method,
    ...(body !== undefined ? { headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) } } : token ? { headers: { authorization: `Bearer ${token}` } } : {}),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const servers: http.Server[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("saved jobs", () => {
  it("saves a job and rejects a duplicate", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);
    const url = `${testServer.url}/jobs/1/save`;

    const saveResponse = await request(url, "POST", tokenFor(1));
    assert.equal(saveResponse.status, 201);
    const savedBody = await saveResponse.json() as { jobId: number };
    assert.equal(savedBody.jobId, 1);

    const duplicateResponse = await request(url, "POST", tokenFor(1));
    assert.equal(duplicateResponse.status, 409);
  });

  it("unsaves only the authenticated candidate's saved job", async () => {
    const initialSaved = [{ id: 1, candidateId: 10, jobId: 1, createdAt: new Date() }];
    const testServer = await createTestServer(1, initialSaved);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/jobs/1/save`, "DELETE", tokenFor(1));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, message: "Job unsaved" });
    assert.equal(testServer.fake.storedSaved.length, 0);

    const missingResponse = await request(`${testServer.url}/jobs/1/save`, "DELETE", tokenFor(1));
    assert.equal(missingResponse.status, 404);
  });

  it("lists only the authenticated candidate's saved jobs", async () => {
    const initialSaved = [
      { id: 1, candidateId: 10, jobId: 1, createdAt: new Date("2026-09-10T00:00:00.000Z") },
      { id: 2, candidateId: 20, jobId: 1, createdAt: new Date("2026-09-11T00:00:00.000Z") },
    ];
    const testServer = await createTestServer(1, initialSaved);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/candidates/saved-jobs`, "GET", tokenFor(1));
    const body = await response.json() as { jobs: Array<{ id: number }>; pagination: { total: number } };
    assert.equal(response.status, 200);
    assert.deepEqual(body.jobs.map(({ id }) => id), [1]);
    assert.equal(body.pagination.total, 1);
  });

  it("rejects unauthenticated, non-candidate, invalid, and missing-job requests", async () => {
    const testServer = await createTestServer(1, [], { jobExists: false });
    servers.push(testServer.server);
    const saveUrl = `${testServer.url}/jobs/1/save`;

    assert.equal((await request(saveUrl, "POST")).status, 401);
    assert.equal((await request(saveUrl, "POST", tokenFor(2, "recruiter"))).status, 403);
    assert.equal((await request(`${testServer.url}/jobs/not-a-number/save`, "POST", tokenFor(1))).status, 400);
    assert.equal((await request(saveUrl, "POST", tokenFor(1))).status, 404);
  });
});

describe("job application submission", () => {
  it("lets a candidate apply with their existing resume and default status", async () => {
    const applications: Array<{ id: number; jobId: number; candidateId: number; status: string; stage: string; resumeUrl: string | null; coverLetter: string | null; createdAt: Date; updatedAt: Date }> = [];
    const candidate = { id: 10, userId: 1, resumeUrl: "https://example.com/resume.pdf" };
    const publishedJob = { id: 1, status: "published" };

    const database = {
      select: () => ({
        from: (table: unknown) => {
          const builder = {
            where: () => ({
              limit: async () => {
                if (table === candidateProfiles) return [candidate];
                if (table === jobs) return [publishedJob];
                return [];
              },
            }),
          };
          return builder;
        },
      }),
      insert: () => ({
        values: (value: { jobId: number; candidateId: number; resumeUrl: string | null; coverLetter: string | null }) => ({
          returning: async () => {
            const record = {
              id: applications.length + 1,
              ...value,
              status: "applied",
              stage: "applied",
              createdAt: new Date("2026-09-20T00:00:00.000Z"),
              updatedAt: new Date("2026-09-20T00:00:00.000Z"),
            };
            applications.push(record);
            return [record];
          },
        }),
      }),
    };

    const app = express();
    app.use(express.json());
    app.use(createJobsRouter(database as never));
    app.use(errorHandler);
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    servers.push(server);

    const response = await request(`http://127.0.0.1:${address.port}/jobs/1/apply`, "POST", tokenFor(1), {
      coverLetter: "I am interested in this position because...",
    });

    assert.equal(response.status, 201);
    const body = await response.json() as { jobId: number; candidateId: number; status: string; stage: string; resumeUrl: string | null; coverLetter: string | null };
    assert.equal(body.status, "applied");
    assert.equal(body.stage, "applied");
    assert.equal(body.jobId, 1);
    assert.equal(body.candidateId, 10);
    assert.equal(body.resumeUrl, "https://example.com/resume.pdf");
    assert.equal(body.coverLetter, "I am interested in this position because...");
    assert.equal(applications.length, 1);
  });

  it("rejects duplicate applications and invalid cover letters", async () => {
    const applications: Array<{ id: number; jobId: number; candidateId: number; status: string; stage: string; resumeUrl: string | null; coverLetter: string | null }> = [
      { id: 1, jobId: 1, candidateId: 10, status: "applied", stage: "applied", resumeUrl: "https://example.com/resume.pdf", coverLetter: null },
    ];
    const candidate = { id: 10, userId: 1, resumeUrl: "https://example.com/resume.pdf" };
    const publishedJob = { id: 1, status: "published" };

    const database = {
      select: () => ({
        from: (table: unknown) => {
          const builder = {
            where: () => ({
              limit: async () => {
                if (table === candidateProfiles) return [candidate];
                if (table === jobs) return [publishedJob];
                if (table === applications) {
                  return applications.filter(
                    (application) => application.candidateId === candidate.id && application.jobId === publishedJob.id,
                  );
                }
                return [];
              },
            }),
          };
          return builder;
        },
      }),
      insert: () => ({
        values: () => ({
          returning: async () => {
            const error = new Error("duplicate key value violates unique constraint");
            (error as Error & { code?: string }).code = "23505";
            throw error;
          },
        }),
      }),
    };

    const app = express();
    app.use(express.json());
    app.use(createJobsRouter(database as never));
    app.use(errorHandler);
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    servers.push(server);

    const duplicateResponse = await request(`http://127.0.0.1:${address.port}/jobs/1/apply`, "POST", tokenFor(1));
    assert.equal(duplicateResponse.status, 409);

    const invalidLetterResponse = await request(`http://127.0.0.1:${address.port}/jobs/1/apply`, "POST", tokenFor(1), {
      coverLetter: "x".repeat(20000),
    });
    assert.equal(invalidLetterResponse.status, 400);
  });
});