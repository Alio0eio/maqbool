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
  resumeUrl: string | null;
  coverLetter: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  interview: {
    id: number;
    type: "async_video" | "live_video" | "phone" | "in_person";
    status: "pending" | "invited" | "in_progress" | "completed" | "cancelled";
    scheduledAt: Date | null;
    deadline: Date | null;
    durationMinutes: number | null;
    invitationNote: string | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
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
  options: {
    interview?: ApplicationRecord["interview"];
    rejectionReason?: string | null;
  } = {},
): ApplicationRecord {
  const createdDate = new Date(createdAt);

  return {
    id,
    candidateId,
    status,
    stage,
    resumeUrl: `https://example.com/resume-${id}.pdf`,
    coverLetter: `Cover letter ${id}`,
    rejectionReason: options.rejectionReason ?? null,
    createdAt: createdDate,
    updatedAt: createdDate,
    interview: options.interview ?? null,
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
  let currentPath = "";
  const activeCandidate = { id: activeUserId * 10, userId: activeUserId };

  function currentApplicationId() {
    const match = currentPath.match(/^\/applications\/([^/]+)$/);
    if (!match) return undefined;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) ? id : undefined;
  }

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
    setCurrentPath(path: string) {
      currentPath = path;
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
          leftJoin: () => builder,
          where: () => builder,
          orderBy: () => builder,
          limit: (limitValue?: number) => {
            if (table === candidateProfiles) {
              return Promise.resolve(options.hasCandidateProfile === false ? [] : [activeCandidate]);
            }

            if (table === applications) {
              if ("resumeUrl" in selection) {
                const applicationId = currentApplicationId();
                const application = initialApplications.find(
                  (item) => item.id === applicationId && item.candidateId === activeCandidate.id,
                );
                if (!application) return Promise.resolve([]);

                return Promise.resolve([
                  {
                    id: application.id,
                    status: application.status,
                    stage: application.stage,
                    appliedAt: application.createdAt,
                    createdAt: application.createdAt,
                    updatedAt: application.updatedAt,
                    resumeUrl: application.resumeUrl,
                    coverLetter: application.coverLetter,
                    rejectionReason: application.rejectionReason,
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
                    interviewId: application.interview?.id ?? null,
                    interviewType: application.interview?.type ?? null,
                    interviewStatus: application.interview?.status ?? null,
                    interviewScheduledAt: application.interview?.scheduledAt ?? null,
                    interviewDeadline: application.interview?.deadline ?? null,
                    interviewDurationMinutes: application.interview?.durationMinutes ?? null,
                    interviewInvitationNote: application.interview?.invitationNote ?? null,
                    interviewCompletedAt: application.interview?.completedAt ?? null,
                    interviewCreatedAt: application.interview?.createdAt ?? null,
                    interviewUpdatedAt: application.interview?.updatedAt ?? null,
                  },
                ]);
              }

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
    fake.setCurrentPath(req.path);
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
  createApplication(3, 10, "2026-09-14T00:00:00.000Z", "interviewing", "interview", {
    interview: {
      id: 300,
      type: "live_video",
      status: "invited",
      scheduledAt: new Date("2026-09-20T12:00:00.000Z"),
      deadline: null,
      durationMinutes: 45,
      invitationNote: "Please join on time.",
      completedAt: null,
      createdAt: new Date("2026-09-15T00:00:00.000Z"),
      updatedAt: new Date("2026-09-15T00:00:00.000Z"),
    },
  }),
  createApplication(4, 20, "2026-09-16T00:00:00.000Z", "offered", "offer"),
  createApplication(5, 10, "2026-09-18T00:00:00.000Z", "rejected", "rejected", {
    rejectionReason: "The role requires more platform experience.",
  }),
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
    assert.deepEqual(body.applications.map(({ id }) => id), [5, 3, 2, 1]);
    assert.equal(body.applications[0].status, "rejected");
    assert.equal(body.applications[0].stage, "rejected");
    assert.equal(body.applications[0].job.title, "Role 5");
    assert.equal(body.applications[0].job.company.name, "Company 5");
    assert.equal(typeof body.applications[0].appliedAt, "string");
    assert.deepEqual(body.pagination, { page: 1, limit: 20, total: 4, totalPages: 1 });
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
    assert.deepEqual(sortBody.applications.map(({ id }) => id), [1, 2, 3, 5]);
    assert.equal(pageResponse.status, 200);
    assert.deepEqual(pageBody.applications.map(({ id }) => id), [2, 1]);
    assert.deepEqual(pageBody.pagination, { page: 2, limit: 2, total: 4, totalPages: 2 });
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

  it("lets an authenticated candidate retrieve one application with job and company details", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/applications/1`, tokenFor(1));
    const body = (await response.json()) as {
      id: number;
      status: string;
      stage: string;
      appliedAt: string;
      resumeUrl: string;
      coverLetter: string;
      job: { id: number; title: string; company: { id: number; name: string } };
      interview: null;
      feedback: null;
    };

    assert.equal(response.status, 200);
    assert.equal(body.id, 1);
    assert.equal(body.status, "applied");
    assert.equal(body.stage, "applied");
    assert.equal(typeof body.appliedAt, "string");
    assert.equal(body.resumeUrl, "https://example.com/resume-1.pdf");
    assert.equal(body.coverLetter, "Cover letter 1");
    assert.equal(body.job.title, "Role 1");
    assert.equal(body.job.company.name, "Company 1");
    assert.equal(body.interview, null);
    assert.equal(body.feedback, null);
  });

  it("includes interview information when the application has an interview", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const response = await request(`${testServer.url}/applications/3`, tokenFor(1));
    const body = (await response.json()) as {
      interview: {
        id: number;
        type: string;
        status: string;
        scheduledAt: string;
        durationMinutes: number;
        invitationNote: string;
      };
      feedback: null;
    };

    assert.equal(response.status, 200);
    assert.equal(body.interview.id, 300);
    assert.equal(body.interview.type, "live_video");
    assert.equal(body.interview.status, "invited");
    assert.equal(typeof body.interview.scheduledAt, "string");
    assert.equal(body.interview.durationMinutes, 45);
    assert.equal(body.interview.invitationNote, "Please join on time.");
    assert.equal(body.feedback, null);
  });

  it("returns candidate-visible feedback only for rejected applications", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    const rejectedResponse = await request(`${testServer.url}/applications/5`, tokenFor(1));
    const rejectedBody = (await rejectedResponse.json()) as { feedback: string };
    const activeResponse = await request(`${testServer.url}/applications/2`, tokenFor(1));
    const activeBody = (await activeResponse.json()) as { feedback: null };

    assert.equal(rejectedResponse.status, 200);
    assert.equal(rejectedBody.feedback, "The role requires more platform experience.");
    assert.equal(activeResponse.status, 200);
    assert.equal(activeBody.feedback, null);
  });

  it("rejects invalid, nonexistent, cross-candidate, and unauthenticated detail requests", async () => {
    const testServer = await createTestServer(1, applicationFixtures);
    servers.push(testServer.server);

    assert.equal((await request(`${testServer.url}/applications/not-a-number`, tokenFor(1))).status, 400);
    assert.equal((await request(`${testServer.url}/applications/999`, tokenFor(1))).status, 404);
    assert.equal((await request(`${testServer.url}/applications/4`, tokenFor(1))).status, 404);
    assert.equal((await request(`${testServer.url}/applications/1`)).status, 401);
  });
});
