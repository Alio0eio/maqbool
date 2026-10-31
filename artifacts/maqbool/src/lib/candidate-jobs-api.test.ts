import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApplicationStatus } from "@workspace/api-client-react";
import {
  getApplicationStatusLabel,
  parseCandidateJobDetails,
  parseCandidateSavedJobsPage,
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

describe("candidate saved jobs API response", () => {
  it("parses the backend saved-jobs page without requiring fields it does not return", () => {
    const response = parseCandidateSavedJobsPage(
      {
        jobs: [
          {
            id: 8,
            jobId: 42,
            savedAt: "2026-10-10T00:00:00.000Z",
            job: {
              id: 42,
              title: "Frontend Engineer",
              company: "Maqbool",
              location: "Remote",
              locationType: "remote",
              type: "full_time",
              createdAt: "2026-10-01T00:00:00.000Z",
            },
          },
        ],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
      1,
      100,
    );

    assert.equal(response.jobs[0].jobId, 42);
    assert.equal(response.jobs[0].job.title, "Frontend Engineer");
    assert.equal(response.pagination.total, 1);
    assert.equal("status" in response.jobs[0].job, false);
  });

  it("rejects malformed saved-job records and pagination", () => {
    const response = {
      jobs: [
        {
          id: 8,
          jobId: 42,
          savedAt: "2026-10-10T00:00:00.000Z",
          job: {
            id: 43,
            title: "Frontend Engineer",
            company: "Maqbool",
            location: "Remote",
            type: "full_time",
            createdAt: "2026-10-01T00:00:00.000Z",
          },
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    };

    assert.throws(() => parseCandidateSavedJobsPage(response, 1, 100), /invalid response/i);
    assert.throws(
      () =>
        parseCandidateSavedJobsPage(
          { jobs: [], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
          1,
          100,
        ),
      /invalid response/i,
    );
  });
});
