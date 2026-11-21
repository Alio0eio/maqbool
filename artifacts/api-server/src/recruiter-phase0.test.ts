import assert from "node:assert/strict";
import test from "node:test";

import {
  recruiterCandidateListQuerySchema,
  recruiterCandidateParamsSchema,
  recruiterContextSchema,
  recruiterApiErrorSchema,
} from "@workspace/api-zod/recruiter";

test("recruiter context contract requires a recruiter and active company state", () => {
  const result = recruiterContextSchema.parse({
    user: {
      id: 1,
      name: "Recruiter One",
      email: "recruiter@example.com",
      role: "recruiter",
    },
    activeCompany: null,
    memberships: [],
  });

  assert.equal(result.activeCompany, null);
});

test("recruiter context contract rejects candidate role", () => {
  const result = recruiterContextSchema.safeParse({
    user: {
      id: 1,
      name: "Candidate One",
      email: "candidate@example.com",
      role: "candidate",
    },
    activeCompany: null,
    memberships: [],
  });

  assert.equal(result.success, false);
});

test("recruiter candidate params reject zero and malformed IDs", () => {
  assert.equal(recruiterCandidateParamsSchema.safeParse({ candidateId: 0 }).success, false);
  assert.equal(recruiterCandidateParamsSchema.safeParse({ candidateId: "bad" }).success, false);
  assert.equal(
    recruiterCandidateParamsSchema.parse({ candidateId: "42" }).candidateId,
    42,
  );
});

test("recruiter candidate list query uses approved defaults and allowlists", () => {
  const result = recruiterCandidateListQuerySchema.parse({
    stage: "interview",
  });

  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.stage, "interview");
  assert.equal(
    recruiterCandidateListQuerySchema.safeParse({ stage: "hired_external" }).success,
    false,
  );
});

test("recruiter API error contract has a stable envelope", () => {
  const result = recruiterApiErrorSchema.parse({
    error: {
      code: "APPLICATION_STALE",
      message: "The application changed before this update.",
    },
  });

  assert.equal(result.error.code, "APPLICATION_STALE");
});
