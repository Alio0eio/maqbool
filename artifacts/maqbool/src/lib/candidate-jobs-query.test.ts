import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  getCandidateJobsEmptyState,
  getCandidateJobsViewState,
  parseJobQuery,
  serializeJobQuery,
} from "./candidate-jobs-query";

describe("candidate jobs URL query validation", () => {
  it("uses the API defaults for an empty query", () => {
    const parsed = parseJobQuery(new URLSearchParams());

    assert.deepEqual(parsed.issues, []);
    assert.equal(parsed.query.page, 1);
    assert.equal(parsed.query.limit, 20);
    assert.equal(parsed.query.sortBy, "postedAt");
    assert.equal(parsed.query.sortOrder, "desc");
  });

  it("accepts valid filters including backend-supported page sizes and experience values", () => {
    const parsed = parseJobQuery(
      new URLSearchParams(
        "page=2&limit=1&companyId=10&q=React&location=Remote&jobType=full_time&locationType=remote&experienceLevel=senior&minSalary=0&maxSalary=120000&skills=React,TypeScript&sortBy=salary&sortOrder=asc",
      ),
    );

    assert.deepEqual(parsed.issues, []);
    assert.equal(parsed.query.page, 2);
    assert.equal(parsed.query.limit, 1);
    assert.equal(parsed.query.companyId, "10");
    assert.equal(parsed.query.experienceLevel, "senior");
    assert.equal(parsed.query.skills, "React,TypeScript");
    assert.equal(parsed.query.sortBy, "salary");
    assert.equal(parsed.query.sortOrder, "asc");
  });

  it("matches the API's empty salary coercion and preserves empty salary bounds as zero", () => {
    const parsed = parseJobQuery(new URLSearchParams("minSalary=&maxSalary="));

    assert.deepEqual(parsed.issues, []);
    assert.equal(parsed.query.minSalary, "0");
    assert.equal(parsed.query.maxSalary, "0");
  });

  it("reports malformed or unsupported values for every supported query control", () => {
    const cases = [
      ["page", "page=0"],
      ["limit", "limit=101"],
      ["companyId", "companyId=0"],
      ["q", `q=${"x".repeat(201)}`],
      ["location", `location=${"x".repeat(256)}`],
      ["jobType", "jobType=unknown"],
      ["locationType", "locationType=unknown"],
      ["experienceLevel", `experienceLevel=${"x".repeat(101)}`],
      ["minSalary", "minSalary=-1"],
      ["maxSalary", "minSalary=100&maxSalary=50"],
      ["skills", "skills=%20,%20"],
      [
        "skills",
        `skills=${Array.from({ length: 21 }, (_, index) => `skill${index}`).join(",")}`,
      ],
      ["sortBy", "sortBy=title"],
      ["sortOrder", "sortOrder=sideways"],
      ["page", "page=1&page=2"],
    ] as const;

    for (const [parameter, search] of cases) {
      const parsed = parseJobQuery(new URLSearchParams(search));
      assert.ok(
        parsed.issues.some((issue) => issue.parameter === parameter),
        search,
      );
    }
  });

  it("preserves valid filters and unrelated URL parameters when invalid ones are reset", () => {
    const original = new URLSearchParams(
      "q=React&jobType=full_time&page=0&sortBy=title&campaign=spring",
    );
    const parsed = parseJobQuery(original);
    const corrected = serializeJobQuery(
      new URLSearchParams(original),
      parsed.query,
    );

    assert.deepEqual(
      parsed.issues.map((issue) => issue.parameter),
      ["page", "sortBy"],
    );
    assert.equal(corrected.get("q"), "React");
    assert.equal(corrected.get("jobType"), "full_time");
    assert.equal(corrected.has("page"), false);
    assert.equal(corrected.has("sortBy"), false);
    assert.equal(corrected.get("campaign"), "spring");
  });

  it("keeps URL-derived filter and pagination changes in the parsed request state", () => {
    const initial = parseJobQuery(new URLSearchParams("q=React&limit=20"));
    const changedUrl = serializeJobQuery(new URLSearchParams(), {
      ...initial.query,
      location: "Remote",
      page: 2,
      limit: 50,
    });
    const changed = parseJobQuery(changedUrl);

    assert.deepEqual(changed.issues, []);
    assert.equal(changed.query.search, "React");
    assert.equal(changed.query.location, "Remote");
    assert.equal(changed.query.page, 2);
    assert.equal(changed.query.limit, 50);
  });
});

describe("candidate jobs view states", () => {
  const base = {
    hasInvalidQuery: false,
    isPending: false,
    isError: false,
    hasData: false,
    isPlaceholderData: false,
    jobCount: 0,
  };

  it("distinguishes invalid queries, loading, request errors, empty data, and results", () => {
    assert.equal(
      getCandidateJobsViewState({ ...base, hasInvalidQuery: true }),
      "invalid-query",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, isPending: true }),
      "loading",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, isError: true }),
      "error",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, hasData: true }),
      "empty",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, hasData: true, jobCount: 1 }),
      "results",
    );
  });

  it("keeps a previous result set during filter changes and preserves current data on refresh errors", () => {
    assert.equal(
      getCandidateJobsViewState({
        ...base,
        hasData: true,
        isPlaceholderData: true,
        jobCount: 1,
      }),
      "updating",
    );
    assert.equal(
      getCandidateJobsViewState({
        ...base,
        hasData: true,
        isError: true,
        jobCount: 1,
      }),
      "results",
    );
  });

  it("distinguishes no available jobs, no filter matches, and an out-of-range page", () => {
    assert.equal(getCandidateJobsEmptyState(false, 0), "no-jobs");
    assert.equal(getCandidateJobsEmptyState(true, 0), "no-matches");
    assert.equal(getCandidateJobsEmptyState(false, 1), "out-of-range");
  });

  it("moves from a request error through retry loading to successful results", () => {
    assert.equal(
      getCandidateJobsViewState({ ...base, isError: true }),
      "error",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, isPending: true }),
      "loading",
    );
    assert.equal(
      getCandidateJobsViewState({ ...base, hasData: true, jobCount: 1 }),
      "results",
    );
  });

  it("recovers from failed requests when refetch is called", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    });
    let attempts = 0;
    const observer = new QueryObserver(client, {
      queryKey: ["candidate-jobs", "retry-test"],
      queryFn: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("Temporary network error");
        return ["job"];
      },
    });

    try {
      const failed = await observer.refetch();
      assert.equal(failed.isError, true);
      assert.equal(attempts, 2);

      const retried = await observer.refetch();
      assert.equal(retried.isSuccess, true);
      assert.deepEqual(retried.data, ["job"]);
      assert.equal(attempts, 3);
    } finally {
      observer.destroy();
      client.clear();
    }
  });
});
