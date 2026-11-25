import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import { afterEach, describe, it } from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.PORT ??= "5000";
process.env.JWT_SECRET ??= "test-secret";
process.env.NODE_ENV ??= "test";

const { default: express } = await import("express");
const { default: cookieParser } = await import("cookie-parser");
const { companies, companyMembers, users } = await import("@workspace/db");
const { generateAccessToken } = await import("./lib/auth");
const { createRecruiterCompanyRegistrationRouter } = await import(
  "./routes/recruiter-company-registration",
);
const { createRecruiterRouter } = await import("./routes/recruiter");
const { errorHandler } = await import("./middlewares/error");

type TestUser = {
  id: number;
  email: string;
  name: string;
  role: "candidate" | "recruiter" | "admin";
};

type TestCompany = {
  id: number;
  name: string;
  applicantUserId: number | null;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  industry?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  size?: string | null;
  location?: string | null;
  description?: string | null;
  culture?: string | null;
  benefits?: string[];
};

type TestMembership = {
  id: number;
  userId: number;
  companyId: number;
  role: "owner" | "admin" | "recruiter" | "hiring_manager" | "billing_admin";
  status: "active" | "invited" | "inactive";
  joinedAt: Date | null;
};

type DatabaseState = {
  user: TestUser;
  companies: TestCompany[];
  memberships: TestMembership[];
  nextCompanyId: number;
};

type FakeDatabase = {
  select: (selection?: Record<string, unknown>) => unknown;
  insert: (table: unknown) => unknown;
  transaction: <T>(callback: (transaction: FakeDatabase) => Promise<T>) => Promise<T>;
};

function createFakeDatabase(state: DatabaseState, currentUserId: number) {
  function resolveRows(table: unknown, selection: Record<string, unknown> | undefined) {
    if (table === users) {
      return state.user.id === currentUserId ? [state.user] : [];
    }

    if (table === companyMembers) {
      return state.memberships
        .filter((membership) => {
          const company = state.companies.find((item) => item.id === membership.companyId);
          return (
            membership.userId === currentUserId &&
            company?.verificationStatus === "approved"
          );
        })
        .map((membership) => ({
          membershipId: membership.id,
          companyId: membership.companyId,
          companyName: state.companies.find((item) => item.id === membership.companyId)?.name,
          role: membership.role,
          status: membership.status,
        }));
    }

    if (table === companies) {
      if (selection && "submittedAt" in selection) {
        return state.companies
          .filter((company) => company.applicantUserId === currentUserId)
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(0, 1)
          .map((company) => ({
            id: company.id,
            status: company.verificationStatus,
            rejectionReason: company.rejectionReason,
            submittedAt: company.createdAt,
            company: {
              id: company.id,
              name: company.name,
              industry: company.industry ?? null,
              website: company.website ?? null,
              logoUrl: company.logoUrl ?? null,
              size: company.size ?? null,
              location: company.location ?? null,
              description: company.description ?? null,
              culture: company.culture ?? null,
              benefits: company.benefits ?? [],
            },
          }));
      }

      if (selection && Object.keys(selection).length === 1 && "id" in selection) {
        return state.companies
          .filter(
            (company) =>
              company.applicantUserId === currentUserId &&
              company.verificationStatus === "pending",
          )
          .slice(0, 1);
      }

      return state.companies.filter((company) => company.verificationStatus === "approved");
    }

    return [];
  }

  const database: FakeDatabase = {
    select: (selection?: Record<string, unknown>) => {
      const query: {
        table?: unknown;
        from: (table: unknown) => typeof query;
        innerJoin: () => typeof query;
        where: () => typeof query;
        orderBy: () => typeof query;
        limit: () => Promise<unknown[]>;
        then: (
          resolve: (value: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise<unknown>;
      } = {
        table: undefined,
        from(table) {
          this.table = table;
          return this;
        },
        innerJoin() {
          return this;
        },
        where() {
          return this;
        },
        orderBy() {
          return this;
        },
        async limit() {
          return resolveRows(this.table, selection);
        },
        then(resolve, reject) {
          return Promise.resolve(resolveRows(this.table, selection)).then(resolve, reject);
        },
      };
      return query;
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => {
          if (table !== companies) return [];
          const now = new Date();
          const company = {
            id: state.nextCompanyId++,
            ...values,
            createdAt: now,
            updatedAt: now,
            rejectionReason: null,
          } as TestCompany;
          state.companies.push(company);
          return [{
            id: company.id,
            verificationStatus: company.verificationStatus,
          }];
        },
      }),
    }),
    transaction: async <T>(callback: (transaction: FakeDatabase) => Promise<T>) =>
      callback(database),
  };

  return database;
}

async function createTestServer(state: DatabaseState, currentUserId = state.user.id) {
  const database = createFakeDatabase(state, currentUserId);
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(createRecruiterCompanyRegistrationRouter(database as never));
  app.use(createRecruiterRouter(database as never));
  app.use(errorHandler);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  };
}

function createState(
  role: TestUser["role"] = "candidate",
  companiesInState: TestCompany[] = [],
  memberships: TestMembership[] = [],
): DatabaseState {
  return {
    user: {
      id: 1,
      email: "user@example.com",
      name: "Example User",
      role,
    },
    companies: companiesInState,
    memberships,
    nextCompanyId: 100,
  };
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
  path: string,
  method = "GET",
  token?: string,
  body?: unknown,
) {
  return fetch(`${url}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("recruiter company registration", () => {
  it("creates a pending company registration for the authenticated candidate without membership", async () => {
    const state = createState();
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const response = await request(
      testServer.url,
      "/recruiter/company-registration",
      "POST",
      tokenFor(state.user),
      { name: "Example Company", industry: "Technology", benefits: ["Health insurance"] },
    );

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      registration: { id: 100, status: "pending" },
    });
    assert.equal(state.companies[0].applicantUserId, state.user.id);
    assert.equal(state.companies[0].verificationStatus, "pending");
    assert.equal(state.memberships.length, 0);
    assert.equal(state.user.role, "candidate");
  });

  it("requires authentication and rejects client-supplied identity or roles", async () => {
    const state = createState();
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const unauthenticated = await request(
      testServer.url,
      "/recruiter/company-registration",
      "POST",
      undefined,
      { name: "Example Company" },
    );
    assert.equal(unauthenticated.status, 401);

    const spoofedIdentity = await request(
      testServer.url,
      "/recruiter/company-registration",
      "POST",
      tokenFor(state.user),
      { name: "Example Company", applicantUserId: 999, role: "owner" },
    );
    assert.equal(spoofedIdentity.status, 400);
    assert.equal(state.companies.length, 0);
  });

  it("rejects duplicate pending registrations and only returns the caller's status", async () => {
    const pending = {
      id: 10,
      name: "Pending Company",
      applicantUserId: 1,
      verificationStatus: "pending" as const,
      rejectionReason: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const state = createState("candidate", [pending]);
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const duplicate = await request(
      testServer.url,
      "/recruiter/company-registration",
      "POST",
      tokenFor(state.user),
      { name: "Second Company" },
    );
    assert.equal(duplicate.status, 409);

    const ownStatus = await request(
      testServer.url,
      "/recruiter/company-registration/me",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(ownStatus.status, 200);
    const ownBody = await ownStatus.json() as { registration: { id: number; status: string } };
    assert.equal(ownBody.registration.id, pending.id);
    assert.equal(ownBody.registration.status, "pending");

    const otherState = createState("candidate", [pending]);
    otherState.user.id = 2;
    const otherServer = await createTestServer(otherState, otherState.user.id);
    servers.push(otherServer.server);
    const otherStatus = await request(
      otherServer.url,
      "/recruiter/company-registration/me",
      "GET",
      tokenFor(otherState.user),
    );
    assert.equal(otherStatus.status, 404);
  });

  it("returns rejection details for the applicant's own registration", async () => {
    const rejected: TestCompany = {
      id: 11,
      name: "Rejected Company",
      applicantUserId: 1,
      verificationStatus: "rejected",
      rejectionReason: "Company details could not be verified",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
    };
    const state = createState("candidate", [rejected]);
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const response = await request(
      testServer.url,
      "/recruiter/company-registration/me",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(response.status, 200);
    const body = await response.json() as {
      registration: { status: string; rejectionReason: string | null };
    };
    assert.equal(body.registration.status, "rejected");
    assert.equal(body.registration.rejectionReason, rejected.rejectionReason);
  });
});

describe("recruiter membership authorization", () => {
  it("grants a candidate-role user recruiter access only through an approved active owner membership", async () => {
    const approved: TestCompany = {
      id: 20,
      name: "Approved Company",
      applicantUserId: 1,
      verificationStatus: "approved",
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const owner: TestMembership = {
      id: 30,
      userId: 1,
      companyId: approved.id,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    };
    const state = createState("candidate", [approved], [owner]);
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const context = await request(
      testServer.url,
      "/recruiter/context",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(context.status, 200);
    const contextBody = await context.json() as {
      user: { role: string };
      activeCompany: { id: number; role: string } | null;
    };
    assert.equal(contextBody.user.role, "candidate");
    assert.deepEqual(contextBody.activeCompany, {
      id: approved.id,
      name: approved.name,
      role: "owner",
      capabilities: [
        "company.read",
        "company.update",
        "team.manage",
        "billing.manage",
        "jobs.manage",
        "applications.view",
        "applications.manage",
        "interviews.manage",
        "offers.manage",
        "messages.manage",
        "reports.view",
      ],
    });

    const company = await request(
      testServer.url,
      "/recruiter/company",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(company.status, 200);
  });

  it("does not grant recruiter access to pending or rejected companies, even if a stale active membership exists", async () => {
    for (const verificationStatus of ["pending", "rejected"] as const) {
      const company: TestCompany = {
        id: verificationStatus === "pending" ? 40 : 41,
        name: `${verificationStatus} Company`,
        applicantUserId: 1,
        verificationStatus,
        rejectionReason: verificationStatus === "rejected" ? "Needs review" : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const membership: TestMembership = {
        id: company.id + 100,
        userId: 1,
        companyId: company.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      };
      const state = createState("candidate", [company], [membership]);
      const testServer = await createTestServer(state);
      servers.push(testServer.server);

      const context = await request(
        testServer.url,
        "/recruiter/context",
        "GET",
        tokenFor(state.user),
      );
      assert.equal(context.status, 200);
      const contextBody = await context.json() as {
        activeCompany: unknown;
        memberships: unknown[];
      };
      assert.equal(contextBody.activeCompany, null);
      assert.deepEqual(contextBody.memberships, []);

      const companyResponse = await request(
        testServer.url,
        "/recruiter/company",
        "GET",
        tokenFor(state.user),
      );
      assert.equal(companyResponse.status, 404);

      const invitation = await request(
        testServer.url,
        "/recruiter/invitations",
        "POST",
        tokenFor(state.user),
        { email: "teammate@example.com", role: "recruiter" },
      );
      assert.equal(invitation.status, 404);
    }
  });

  it("requires explicit company selection for multiple memberships and rejects another company's ID", async () => {
    const firstCompany: TestCompany = {
      id: 50,
      name: "First Company",
      applicantUserId: 1,
      verificationStatus: "approved",
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const secondCompany: TestCompany = {
      ...firstCompany,
      id: 51,
      name: "Second Company",
    };
    const memberships: TestMembership[] = [firstCompany, secondCompany].map((company, index) => ({
      id: 60 + index,
      userId: 1,
      companyId: company.id,
      role: "recruiter",
      status: "active",
      joinedAt: new Date(),
    }));
    const state = createState("candidate", [firstCompany, secondCompany], memberships);
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const ambiguousContext = await request(
      testServer.url,
      "/recruiter/context",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(ambiguousContext.status, 200);
    const ambiguousBody = await ambiguousContext.json() as {
      activeCompany: unknown;
      memberships: { companyId: number }[];
    };
    assert.equal(ambiguousBody.activeCompany, null);
    assert.deepEqual(ambiguousBody.memberships.map((membership) => membership.companyId), [50, 51]);

    const explicitlySelected = await request(
      testServer.url,
      `/recruiter/context?companyId=${secondCompany.id}`,
      "GET",
      tokenFor(state.user),
    );
    assert.equal(explicitlySelected.status, 200);
    const selectedBody = await explicitlySelected.json() as {
      activeCompany: { id: number } | null;
    };
    assert.equal(selectedBody.activeCompany?.id, secondCompany.id);

    const noSelection = await request(
      testServer.url,
      "/recruiter/company",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(noSelection.status, 404);

    const unownedCompany = await request(
      testServer.url,
      "/recruiter/company?companyId=999",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(unownedCompany.status, 404);
  });

  it("does not treat platform-admin role as recruiter tenant membership", async () => {
    const state = createState("admin");
    const testServer = await createTestServer(state);
    servers.push(testServer.server);

    const company = await request(
      testServer.url,
      "/recruiter/company",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(company.status, 404);

    const context = await request(
      testServer.url,
      "/recruiter/context",
      "GET",
      tokenFor(state.user),
    );
    assert.equal(context.status, 200);
    const body = await context.json() as {
      user: { role: string };
      activeCompany: unknown;
    };
    assert.equal(body.user.role, "admin");
    assert.equal(body.activeCompany, null);
  });
});
