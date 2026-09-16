import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import express from "express";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { jobs } = await import("@workspace/db");
const { createJobsRouter } = await import("./routes/jobs");
const { errorHandler } = await import("./middlewares/error");

const publishedJob = {
  id: 1,
  title: "Senior TypeScript Engineer",
  companyId: 10,
  company: "Acme",
  companyLogoUrl: null,
  location: "Remote",
  locationType: "remote" as const,
  type: "full_time" as const,
  salaryMin: 100000,
  salaryMax: 140000,
  salaryCurrency: "USD",
  description: "Build great software.",
  requirements: null,
  responsibilities: null,
  benefits: null,
  skills: ["TypeScript", "React"],
  status: "published" as const,
  viewCount: 0,
  postedAt: new Date("2026-09-01T00:00:00.000Z"),
  closingDate: null,
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  department: "Engineering",
  experienceLevel: "senior",
};

function createFakeDatabase(result = [publishedJob]) {
  const calls: Array<{ kind: string; value?: number }> = [];
  const database = {
    select: (selection: Record<string, unknown>) => ({
      from: (_table: unknown) => {
        if ("count" in selection) {
          return { where: async () => [{ count: String(result.length) }] };
        }

        const builder = {
          innerJoin: () => builder,
          where: (_condition: unknown) => builder,
          orderBy: (_order: unknown) => {
            calls.push({ kind: "orderBy" });
            return builder;
          },
          limit: (value: number) => {
            calls.push({ kind: "limit", value });
            return builder;
          },
          offset: async (value: number) => {
            calls.push({ kind: "offset", value });
            return "count" in selection ? [{ count: String(result.length) }] : result;
          },
        };
        return builder;
      },
    }),
  };

  return { database, calls };
}

async function createTestServer(result = [publishedJob]) {
  const fake = createFakeDatabase(result);
  const app = express();
  app.use(createJobsRouter(fake.database as never));
  app.use(errorHandler);
  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { fake, server, url: `http://127.0.0.1:${address.port}` };
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("GET /jobs", () => {
  it("returns published jobs with pagination metadata", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);

    const response = await fetch(`${testServer.url}/jobs?page=2&limit=1`);
    const body = (await response.json()) as {
      jobs: typeof publishedJob[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.pagination, { page: 2, limit: 1, total: 1, totalPages: 1 });
    assert.deepEqual(body.jobs, [{
      ...publishedJob,
      postedAt: publishedJob.postedAt.toISOString(),
      createdAt: publishedJob.createdAt.toISOString(),
    }]);
    assert.deepEqual(testServer.fake.calls.slice(-2), [
      { kind: "limit", value: 1 },
      { kind: "offset", value: 1 },
    ]);
  });

  for (const [name, query] of [
    ["company", "companyId=10"],
    ["job type", "jobType=full_time"],
    ["location type", "locationType=remote"],
    ["experience level", "experienceLevel=senior"],
    ["salary range", "minSalary=90000&maxSalary=150000"],
    ["skills", "skills=TypeScript,React"],
    ["posted date sorting", "sortBy=postedAt&sortOrder=asc"],
    ["salary sorting", "sortBy=salary&sortOrder=desc"],
  ] as const) {
    it(`accepts the ${name} filter`, async () => {
      const testServer = await createTestServer();
      servers.push(testServer.server);

      const response = await fetch(`${testServer.url}/jobs?${query}`);
      assert.equal(response.status, 200);
    });
  }

  it("rejects unsafe or invalid query parameters", async () => {
    const testServer = await createTestServer();
    servers.push(testServer.server);

    for (const query of [
      "limit=101",
      "page=0",
      "jobType=unknown",
      "sortBy=title",
      "minSalary=not-a-number",
      "minSalary=200&maxSalary=100",
      "unexpected=value",
    ]) {
      const response = await fetch(`${testServer.url}/jobs?${query}`);
      assert.equal(response.status, 400, query);
    }
  });

  it("returns an empty list when no published jobs match", async () => {
    const testServer = await createTestServer([]);
    servers.push(testServer.server);

    const response = await fetch(`${testServer.url}/jobs?companyId=999`);
    const body = (await response.json()) as {
      jobs: Array<{ status: string }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      jobs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it("does not expose unpublished jobs", async () => {
    const testServer = await createTestServer([publishedJob]);
    servers.push(testServer.server);

    const response = await fetch(`${testServer.url}/jobs`);
    const body = (await response.json()) as {
      jobs: Array<{ status: string }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(response.status, 200);
    assert.ok(body.jobs.every((job: { status: string }) => job.status === "published"));
    assert.equal(body.jobs.some((job: { status: string }) => job.status !== "published"), false);
  });
});