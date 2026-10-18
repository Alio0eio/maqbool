import { type Job } from '@workspace/api-client-react';
import { authenticatedApiRequest } from './authenticated-api';

const PAGE_SIZE = 100;
const JOB_TYPES: readonly Job['type'][] = ['full_time', 'part_time', 'contract', 'internship'];
const LOCATION_TYPES: readonly NonNullable<Job['locationType']>[] = ['remote', 'hybrid', 'onsite'];

interface JobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CandidateJobsResult {
  jobs: Job[];
  pagination: JobsPagination;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

function isOptionalNullableNumber(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'number';
}

function isJob(value: unknown): value is Job {
  if (!isRecord(value)) return false;

  return (
    Number.isSafeInteger(value.id) &&
    typeof value.title === 'string' &&
    typeof value.company === 'string' &&
    typeof value.location === 'string' &&
    JOB_TYPES.includes(value.type as Job['type']) &&
    value.status === 'published' &&
    typeof value.createdAt === 'string' &&
    (value.locationType === undefined ||
      (typeof value.locationType === 'string' &&
        LOCATION_TYPES.includes(value.locationType as NonNullable<Job['locationType']>))) &&
    isOptionalNullableNumber(value.companyId) &&
    isOptionalNullableString(value.companyLogoUrl) &&
    isOptionalNullableNumber(value.salaryMin) &&
    isOptionalNullableNumber(value.salaryMax) &&
    isOptionalNullableString(value.salaryCurrency) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableString(value.requirements) &&
    isOptionalNullableString(value.responsibilities) &&
    isOptionalNullableString(value.benefits) &&
    (value.skills === undefined || (Array.isArray(value.skills) && value.skills.every((skill) => typeof skill === 'string'))) &&
    (value.applicantCount === undefined || typeof value.applicantCount === 'number') &&
    (value.viewCount === undefined || typeof value.viewCount === 'number') &&
    isOptionalNullableString(value.postedAt) &&
    isOptionalNullableString(value.closingDate) &&
    isOptionalNullableString(value.department) &&
    isOptionalNullableString(value.experienceLevel)
  );
}

function parseJobsPage(value: unknown, expectedPage: number): CandidateJobsResult {
  if (!isRecord(value) || !Array.isArray(value.jobs) || !isRecord(value.pagination)) {
    throw new Error('The jobs service returned an invalid response.');
  }

  const { page, limit, total, totalPages } = value.pagination;
  if (
    page !== expectedPage ||
    limit !== PAGE_SIZE ||
    typeof total !== 'number' ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    typeof totalPages !== 'number' ||
    !Number.isSafeInteger(totalPages) ||
    totalPages < 0 ||
    totalPages !== Math.ceil(total / PAGE_SIZE) ||
    !value.jobs.every(isJob)
  ) {
    throw new Error('The jobs service returned an invalid response.');
  }

  return {
    jobs: value.jobs,
    pagination: { page: expectedPage, limit: PAGE_SIZE, total, totalPages },
  };
}

async function getJobsPage(page: number, signal?: AbortSignal): Promise<CandidateJobsResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  const response = await authenticatedApiRequest<unknown>(`/jobs?${params}`, { signal });
  return parseJobsPage(response, page);
}

export async function getCandidateJobs(signal?: AbortSignal): Promise<CandidateJobsResult> {
  const firstPage = await getJobsPage(1, signal);
  if (firstPage.pagination.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      getJobsPage(index + 2, signal),
    ),
  );

  return {
    jobs: [firstPage, ...remainingPages].flatMap(({ jobs }) => jobs),
    pagination: firstPage.pagination,
  };
}
