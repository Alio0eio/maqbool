import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  candidateApplicationDetailsQueryKey,
  getCandidateApplications,
  getCandidateApplicationDetails,
  parseCandidateApplicationsPage,
} from "./candidate-applications-api";

const originalFetch = globalThis.fetch;

function application(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    status: "applied",
    stage: "applied",
    appliedAt: "2026-10-10T12:00:00.000Z",
    createdAt: "2026-10-10T12:00:00.000Z",
    job: {
      id: id + 100,
      title: `Role ${id}`,
      location: "Remote",
      company: { name: `Company ${id}`, logoUrl: null },
    },
    ...overrides,
  };
}

function applicationsPage(
  applications: unknown[],
  page: number,
  total: number,
  limit = 100,
) {
  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("candidate applications API", () => {
  it("parses backend applications and tolerates optional company logos and applied dates", () => {
    const parsed = parseCandidateApplicationsPage(
      applicationsPage(
        [application(1, { appliedAt: undefined, job: {
          id: 101,
          title: "Role 1",
          location: "Remote",
          company: { name: "Company 1" },
        } })],
        1,
        1,
      ),
      1,
      100,
    );

    assert.equal(parsed.applications[0].id, 1);
    assert.equal(parsed.applications[0].job.company.name, "Company 1");
    assert.equal(parsed.applications[0].job.company.logoUrl, undefined);
  });

  it("rejects malformed or inconsistent paginated responses", () => {
    assert.throws(
      () => parseCandidateApplicationsPage(applicationsPage([application(1)], 2, 1), 1, 100),
      /invalid response/i,
    );
    assert.throws(
      () => parseCandidateApplicationsPage(applicationsPage([{ id: 1 }], 1, 1), 1, 100),
      /invalid response/i,
    );
  });

  it("loads every page using the authenticated candidate applications endpoint", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      requests.push(url);
      const page = new URL(url, "http://localhost").searchParams.get("page");
      const body = page === "1"
        ? applicationsPage(
            Array.from({ length: 100 }, (_, index) => application(index + 1)),
            1,
            101,
          )
        : applicationsPage([application(101)], 2, 101);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await getCandidateApplications();

    assert.equal(result.length, 101);
    assert.equal(result[0].id, 1);
    assert.equal(result[100].id, 101);
    assert.equal(requests.length, 2);
    assert.ok(requests.every((url) => url.includes("/api/candidates/applications?")));
    assert.ok(requests[0].includes("page=1&limit=100"));
    assert.ok(requests[1].includes("page=2&limit=100"));
  });

  it("rejects a response when the result total changes between pages", async () => {
    globalThis.fetch = async (input) => {
      const page = new URL(String(input), "http://localhost").searchParams.get("page");
      const body = page === "1"
        ? applicationsPage(
            Array.from({ length: 100 }, (_, index) => application(index + 1)),
            1,
            101,
          )
        : applicationsPage([application(101)], 2, 102);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(getCandidateApplications(), /changed while the results/i);
  });

  it("loads application details using the application ID and scopes detail cache by candidate", async () => {
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({
        ...application(7),
        updatedAt: "2026-10-11T12:00:00.000Z",
        feedback: null,
        interview: null,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await getCandidateApplicationDetails(7);

    assert.equal(result.id, 7);
    assert.equal(result.interview, null);
    assert.ok(requestedUrl.endsWith("/api/applications/7"));
    assert.notDeepEqual(candidateApplicationDetailsQueryKey(1, 7), candidateApplicationDetailsQueryKey(2, 7));
  });
});
