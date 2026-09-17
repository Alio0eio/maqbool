import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import express from "express";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";

const { applications, candidateProfiles } = await import("@workspace/db");
const { createCandidatesRouter } = await import("./routes/candidates");
const { errorHandler } = await import("./middlewares/error");
const { generateAccessToken } = await import("./lib/auth");

type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

type ApplicationStage =
  | "applied"
  | "screening"
  | "interview"
  | "decision"
  | "offer"
  | "hired"
  | "rejected";

type ApplicationRecord = {
  id: number;
  candidateId: number;
  status: ApplicationStatus;
  stage: ApplicationStage;
  createdAt: Date;
  job: {
    id: number;
    title: string;
    companyId: number;
    location: string;
    locationType: "remote" | "hybrid" | "onsite";
    type: "full_time" | "part_time" | "contract" | "internship";
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    description: string | null;
    requirements: string | null;
    responsibilities: string | null;
    benefits: string | null;
    skills: string[];
    status: "draft" | "published" | "closed" | "paused";
    viewCount: number;
    postedAt: Date | null;
    closingDate: string | null;
    createdAt: Date;
    department: string | null;
    experienceLevel: string | null;
    company: {
      id: number;
      name: string;
      industry: string | null;
      website: string | null;
      logoUrl: string | null;
      size: string | null;
      location: string | null;
      description: string | null;
    };
  };
};

function createApplication(
  id: number,
  candidateId: number,
  createdAt: string,
  status: ApplicationStatus,
  stage: ApplicationStage,
): ApplicationRecord {
  return {
    id,
    candidateId,
    status,
    stage,
    createdAt: new Date(createdAt),
    job: {
      id: id * 100,
      title: `Role ${id}`,
      companyId: id * 1000,
      location: "Remote",
      locationType: "remote",
      type: "full_time",
      salaryMin: 100000,
      salaryMax: 140000,
      salaryCurrency: "USD",
      description: "Build useful software",
      requirements: "TypeScript",
      responsibilities: "Ship product",
      benefits: "Healthcare",
      skills: ["TypeScript"],
      status: "published",
      viewCount: 10,
      postedAt: new Date("2026-09-01T00:00:00.000Z"),
      closingDate: null,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      department: "Engineering",
      experienceLevel: "senior",
      company: {
        id: id * 1000,
        name: `Company ${id}`,
        industry: "Technology",
        website: "https://example.com",
        logoUrl: null,
        size: "51-200",
        location: "Cairo",
        description: "A company",
      },
    },
  };
}

function createFakeDatabase(
  activeUserId: number,
  initialApplications: ApplicationRecord[],
  options: { hasCandidateProfile?: boolean } = {},
) {
  let currentQuery: Record<string, unknown> = {};
  const activeCandidate = { id: activeUserId * 10, userId: activeUserId };

  function matchingApplications() {
    const status = typeof currentQuery.status === "string" ? currentQuery.status : undefined;
    const stage = typeof currentQuery.stage === "string" ? currentQuery.stage : undefined;
    const sortOrder = currentQuery.sortOrder === "asc" ? "asc" : "desc";

    return initialApplications
      .filter((application) => application.candidateId === activeCandidate.id)
      .filter((application) => status === undefined || application.status === status)
      .filter((application) => stage === undefined || application.stage === stage)
      .sort((left, right) =>
        sortOrder === "asc"
          ? left.createdAt.getTime() - right.createdAt.getTime()
          : right.createdAt.getTime() - left.createdAt.getTime(),
      );
  }

  const database = {
    setCurrentQuery(query: Record<string, unknown>) {
      currentQuery = query;
    },
    select: (selection: Record<string, unknown>) => ({
      from: (table: unknown) => {
        if ("count" in selection) {
          return {
            where: async () => [{ count: String(matchingApplications().length) }],
          };
        }

        const builder = {
          innerJoin: () => builder,
          where: () => builder,
          orderBy: () => builder,
          limit: (limitValue?: number) => {
            if (table === candidateProfiles) {
              return Promise.resolve(options.hasCandidateProfile === false ? [] : [activeCandidate]);
            }

            if (table === applications) {
              return {
                offset: async (offsetValue: number) =>
                  matchingApplications()
                    .slice(offsetValue, offsetValue + (limitValue ?? 20))
                    .map((application) => ({
                      id: application.id,
                      status: application.status,
                      stage: application.stage,
                      appliedAt: application.createdAt,
                      createdAt: application.createdAt,
                      companyId: application.job.company.id,
                      companyName: application.job.company.name,
                      companyIndustry: application.job.company.industry,
                      companyWebsite: application.job.company.website,
                      companyLogoUrl: application.job.company.logoUrl,
                      companySize: application.job.company.size,
                      companyLocation: application.job.company.location,
                      companyDescription: application.job.company.description,
                      job: {
                        id: application.job.id,
                        title: application.job.title,
                        companyId: application.job.companyId,
                        location: application.job.location,
                        locationType: application.job.locationType,
                        type: application.job.type,
                        salaryMin: application.job.salaryMin,
                        salaryMax: application.job.salaryMax,
                        salaryCurrency: application.job.salaryCurrency,
                        description: application.job.description,
                        requirements: application.job.requirements,
                        responsibilities: application.job.responsibilities,
                        benefits: application.job.benefits,
                        skills: application.job.skills,
                        status: application.job.status,
                        viewCount: application.job.viewCount,
                        postedAt: application.job.postedAt,
                        closingDate: application.job.closingDate,
                        createdAt: application.job.createdAt,
                        department: application.job.department,
                        experienceLevel: application.job.experienceLevel,
                      },
                    })),
              };
            }

            return Promise.resolve([]);
          },
        };
        return builder;
      },
    }),
  };

  return database;
}

async function createTestServer(
  activeUserId = 1,
  initialApplications: ApplicationRecord[] = [],
  options: { hasCandidateProfile?: boolean } = {},
) {
  const fake = createFakeDatabase(activeUserId, initialApplications, options);
  const app = express();
  app.use((req, _res, next) => {
    fake.setCurrentQuery(req.query);
    next();
  });
  app.use(createCandidatesRouter(fake as never));
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

function tokenFor(userId: number, role: "candidate" | "recruiter" = "candidate") {
  return generateAccessToken(userId, { role });
}

async function request(url: string, token?: string) {
  return fetch(url, {
    method: "GET",
    ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
  });
}

const servers: http.Server[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

const applicationFixtures = [
  createApplication(1, 10, "2026-09-10T00:00:00.000Z", "applied", "applied"),
  createApplication(2, 10, "2026-09-12T00:00:00.000Z", "reviewing", "screening"),
  createApplication(3, 10, "2026-09-14T00:00:00.000Z", "interviewing", "interview"),
  createApplication(4, 20, "2026-09-16T00:00:00.000Z", "offered", "offer"),
];

describe("candidate applications", () => {
  it("lets an authenticated candidate retrieve their applications with job and company details", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/candidates/applications`, tokenFor(1));
    const body = (await response.json()) as {
      applications: Array<{ id: number; status: string; stage: string; appliedAt: string; job: { title: string; company: { name: string } } }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.applications.map(({ id }) => id), [3, 2, 1]);
    assert.equal(body.applications[0].status, "interviewing");
    assert.equal(body.applications[0].stage, "interview");
    assert.equal(body.applications[0].job.title, "Role 3");
    assert.equal(body.applications[0].job.company.name, "Company 3");
    assert.equal(typeof body.applications[0].appliedAt, "string");
    assert.deepEqual(body.pagination, { page: 1, limit: 20, total: 3, totalPages: 1 });
  });

  it("does not return another candidate's applications", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/candidates/applications`, tokenFor(1));
    const body = (await response.json()) as { applications: Array<{ id: number }> };

    assert.equal(response.status, 200);
    assert.ok(!body.applications.some((application) => application.id === 4));
  });

  it("filters by status and stage", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const statusResponse = await request(
      `${testServer.url}/candidates/applications?status=reviewing`,
      tokenFor(1),
    );
    const statusBody = (await statusResponse.json()) as { applications: Array<{ id: number }> };
    const stageResponse = await request(
      `${testServer.url}/candidates/applications?stage=interview`,
      tokenFor(1),
    );
    const stageBody = (await stageResponse.json()) as { applications: Array<{ id: number }> };

    assert.equal(statusResponse.status, 200);
    assert.deepEqual(statusBody.applications.map(({ id }) => id), [2]);
    assert.equal(stageResponse.status, 200);
    assert.deepEqual(stageBody.applications.map(({ id }) => id), [3]);
  });

  it("sorts by application date and paginates", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const sortResponse = await request(
      `${testServer.url}/candidates/applications?sortOrder=asc`,
      tokenFor(1),
    );
    const sortBody = (await sortResponse.json()) as { applications: Array<{ id: number }> };
    const pageResponse = await request(
      `${testServer.url}/candidates/applications?page=2&limit=2`,
      tokenFor(1),
    );
    const pageBody = (await pageResponse.json()) as {
      applications: Array<{ id: number }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(sortResponse.status, 200);
    assert.deepEqual(sortBody.applications.map(({ id }) => id), [1, 2, 3]);
    assert.equal(pageResponse.status, 200);
    assert.deepEqual(pageBody.applications.map(({ id }) => id), [1]);
    assert.deepEqual(pageBody.pagination, { page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it("rejects unauthenticated, non-candidate, invalid query, and missing-profile requests", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);
    const missingProfileServer = await createTestServer(1, applicationFixtures, {
      hasCandidateProfile: false,
    });
    servers.push(missingProfileServer.server);

    assert.equal((await request(`${testServer.url}/candidates/applications`)).status, 401);
    assert.equal((await request(`${testServer.url}/candidates/applications`, tokenFor(2, "recruiter"))).status, 403);
    assert.equal(
      (await request(`${testServer.url}/candidates/applications?status=unknown`, tokenFor(1))).status,
      400,
    );
    assert.equal(
      (await request(`${testServer.url}/candidates/applications?candidateId=20`, tokenFor(1))).status,
      400,
    );
    assert.equal(
      (await request(`${missingProfileServer.url}/candidates/applications`, tokenFor(1))).status,
      404,
    );
  });
});
