import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApplicationStatus } from "@workspace/api-client-react";
import {
  getApplicationStatusLabel,
  parseCandidateJobDetails,
} from "./candidate-job-details";

function jobDetails(applicationStatus: unknown = null) {
  return {
    id: 42,
    title: "Frontend Engineer",
    companyId: 7,
    company: { name: "Maqbool", logo: "https://example.com/logo.png" },
    location: "Remote",
    locationType: "remote",
    type: "full_time",
    status: "published",
    createdAt: "2026-10-01T00:00:00.000Z",
    applicationStatus,
  };
}

describe("candidate job details API response", () => {
  it("maps the nested backend company into the existing Job shape", () => {
    const job = parseCandidateJobDetails(jobDetails());

    assert.equal(job.id, 42);
    assert.equal(job.company, "Maqbool");
    assert.equal(job.companyLogoUrl, "https://example.com/logo.png");
    assert.equal(job.applicationStatus, null);
  });

  it("rejects responses without a usable application status", () => {
    const response = jobDetails();
    delete (response as { applicationStatus?: unknown }).applicationStatus;

    assert.throws(() => parseCandidateJobDetails(response), /invalid response/i);
    assert.throws(
      () => parseCandidateJobDetails({ ...jobDetails(), applicationStatus: 123 }),
      /invalid response/i,
    );
  });
});

describe("candidate application status labels", () => {
  it("shows distinct labels for every backend application status", () => {
    const labels = [
      getApplicationStatusLabel(ApplicationStatus.applied),
      getApplicationStatusLabel(ApplicationStatus.reviewing),
      getApplicationStatusLabel(ApplicationStatus.shortlisted),
      getApplicationStatusLabel(ApplicationStatus.interviewing),
      getApplicationStatusLabel(ApplicationStatus.offered),
      getApplicationStatusLabel(ApplicationStatus.rejected),
      getApplicationStatusLabel(ApplicationStatus.withdrawn),
    ];

    assert.equal(new Set(labels).size, 7);
    assert.equal(getApplicationStatusLabel(null), null);
    assert.equal(getApplicationStatusLabel("unexpected"), "Application status: unexpected");
  });
});
