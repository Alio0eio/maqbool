import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCandidateProfileRequestSchema,
  updateCandidateProfileRequestSchema,
} from "@workspace/api-zod/candidates";

describe("candidate profile validation schemas", () => {
  it("accepts valid profile fields and trims text values", () => {
    const result = updateCandidateProfileRequestSchema.safeParse({
      headline: "  Junior Data Analyst  ",
      yearsOfExperience: 2,
      skills: [" SQL ", "Power BI", "Python"],
      portfolioUrl: "https://example.com/portfolio",
      linkedinUrl: "https://www.linkedin.com/in/example",
      githubUrl: "https://github.com/example",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.headline, "Junior Data Analyst");
      assert.deepEqual(result.data.skills, ["SQL", "Power BI", "Python"]);
    }
  });

  it("accepts partial profile updates and omitted optional fields", () => {
    assert.equal(
      updateCandidateProfileRequestSchema.safeParse({ headline: "Junior Data Analyst" })
        .success,
      true,
    );
    assert.equal(
      updateCandidateProfileRequestSchema.safeParse({ skills: ["SQL", "Python"] }).success,
      true,
    );
    assert.equal(
      updateCandidateProfileRequestSchema.safeParse({
        linkedinUrl: "https://www.linkedin.com/in/example",
      }).success,
      true,
    );
    assert.equal(createCandidateProfileRequestSchema.safeParse({}).success, true);
  });

  it("rejects empty headlines, invalid experience values, and invalid skills", () => {
    for (const headline of ["", "   "]) {
      assert.equal(updateCandidateProfileRequestSchema.safeParse({ headline }).success, false);
    }

    for (const yearsOfExperience of [-2, 2.5, Number.NaN, 101]) {
      assert.equal(
        updateCandidateProfileRequestSchema.safeParse({ yearsOfExperience }).success,
        false,
      );
    }

    for (const skills of [[], [""], ["   "], ["SQL", " SQL "]]) {
      assert.equal(updateCandidateProfileRequestSchema.safeParse({ skills }).success, false);
    }
  });

  it("rejects invalid and empty URLs while accepting valid URLs", () => {
    for (const field of ["portfolioUrl", "linkedinUrl", "githubUrl"] as const) {
      assert.equal(
        updateCandidateProfileRequestSchema.safeParse({ [field]: "not-a-url" }).success,
        false,
      );
      assert.equal(
        updateCandidateProfileRequestSchema.safeParse({ [field]: "   " }).success,
        false,
      );
    }

    assert.equal(
      updateCandidateProfileRequestSchema.safeParse({
        portfolioUrl: "https://example.com",
        linkedinUrl: "https://www.linkedin.com/in/example",
        githubUrl: "https://github.com/example",
      }).success,
      true,
    );
  });
});