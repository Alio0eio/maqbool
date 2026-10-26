import { ApplicationStatus, type Job } from "@workspace/api-client-react";

const JOB_TYPES: readonly Job["type"][] = ["full_time", "part_time", "contract", "internship"];
const LOCATION_TYPES: readonly NonNullable<Job["locationType"]>[] = ["remote", "hybrid", "onsite"];

export type CandidateJobDetails = Job & {
  applicationStatus: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalNullableNumber(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "number";
}

export function isCandidateJob(value: unknown): value is Job {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.company === "string" &&
    typeof value.location === "string" &&
    JOB_TYPES.includes(value.type as Job["type"]) &&
    value.status === "published" &&
    typeof value.createdAt === "string" &&
    (value.locationType === undefined ||
      (typeof value.locationType === "string" &&
        LOCATION_TYPES.includes(value.locationType as NonNullable<Job["locationType"]>))) &&
    isOptionalNullableNumber(value.companyId) &&
    isOptionalNullableString(value.companyLogoUrl) &&
    isOptionalNullableNumber(value.salaryMin) &&
    isOptionalNullableNumber(value.salaryMax) &&
    isOptionalNullableString(value.salaryCurrency) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableString(value.requirements) &&
    isOptionalNullableString(value.responsibilities) &&
    isOptionalNullableString(value.benefits) &&
    (value.skills === undefined || (Array.isArray(value.skills) && value.skills.every((skill) => typeof skill === "string"))) &&
    (value.applicantCount === undefined || typeof value.applicantCount === "number") &&
    (value.viewCount === undefined || typeof value.viewCount === "number") &&
    isOptionalNullableString(value.postedAt) &&
    isOptionalNullableString(value.closingDate) &&
    isOptionalNullableString(value.department) &&
    isOptionalNullableString(value.experienceLevel)
  );
}

export function parseCandidateJobDetails(value: unknown): CandidateJobDetails {
  if (
    !isRecord(value) ||
    !Object.prototype.hasOwnProperty.call(value, "applicationStatus") ||
    !(value.applicationStatus === null || typeof value.applicationStatus === "string") ||
    !isRecord(value.company) ||
    typeof value.company.name !== "string" ||
    !isOptionalNullableString(value.company.logo)
  ) {
    throw new Error("The job service returned an invalid response.");
  }

  const { company, applicationStatus, ...jobFields } = value;
  const job = {
    ...jobFields,
    company: company.name,
    companyLogoUrl: company.logo,
  };

  if (!isCandidateJob(job)) {
    throw new Error("The job service returned an invalid response.");
  }

  return { ...job, applicationStatus };
}

export function getApplicationStatusLabel(status: CandidateJobDetails["applicationStatus"]): string | null {
  if (status === null) return null;

  switch (status) {
    case ApplicationStatus.applied:
      return "Application submitted";
    case ApplicationStatus.reviewing:
      return "Under review";
    case ApplicationStatus.shortlisted:
      return "Shortlisted";
    case ApplicationStatus.interviewing:
      return "Interview in progress";
    case ApplicationStatus.offered:
      return "Offer received";
    case ApplicationStatus.rejected:
      return "Application rejected";
    case ApplicationStatus.withdrawn:
      return "Application withdrawn";
    default:
      return `Application status: ${status}`;
  }
}
