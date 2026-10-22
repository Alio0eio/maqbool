import { type Job } from '@workspace/api-client-react';
import { authenticatedApiRequest } from './authenticated-api';

const JOB_TYPES: readonly Job['type'][] = ['full_time', 'part_time', 'contract', 'internship'];
const LOCATION_TYPES: readonly NonNullable<Job['locationType']>[] = ['remote', 'hybrid', 'onsite'];

export interface CandidateJobsQuery {
  page: number;
  limit: number;
  companyId?: string;
  search?: string;
  location?: string;
  jobType?: Job['type'] | '';
  locationType?: NonNullable<Job['locationType']> | '';
  experienceLevel?: string;
  minSalary?: string;
  maxSalary?: string;
  skills?: string;
  sortBy: 'postedAt' | 'salary';
  sortOrder: 'asc' | 'desc';
}

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

function parseJobsPage(value: unknown, expectedQuery: CandidateJobsQuery): CandidateJobsResult {
  if (!isRecord(value) || !Array.isArray(value.jobs) || !isRecord(value.pagination)) {
    throw new Error('The jobs service returned an invalid response.');
  }

  const { page, limit, total, totalPages } = value.pagination;
  if (
    page !== expectedQuery.page ||
    limit !== expectedQuery.limit ||
    typeof total !== 'number' ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    typeof totalPages !== 'number' ||
    !Number.isSafeInteger(totalPages) ||
    totalPages < 0 ||
    totalPages !== Math.ceil(total / expectedQuery.limit) ||
    !value.jobs.every(isJob)
  ) {
    throw new Error('The jobs service returned an invalid response.');
  }

  return {
    jobs: value.jobs,
    pagination: { page: expectedQuery.page, limit: expectedQuery.limit, total, totalPages },
  };
}

export async function getCandidateJobs(
  query: CandidateJobsQuery,
  signal?: AbortSignal,
): Promise<CandidateJobsResult> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.companyId) params.set('companyId', query.companyId);
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.location?.trim()) params.set('location', query.location.trim());
  if (query.jobType) params.set('jobType', query.jobType);
  if (query.locationType) params.set('locationType', query.locationType);
  if (query.experienceLevel) params.set('experienceLevel', query.experienceLevel);
  if (query.minSalary) params.set('minSalary', query.minSalary);
  if (query.maxSalary) params.set('maxSalary', query.maxSalary);
  if (query.skills?.trim()) {
    const skills = query.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    if (skills.length > 0) params.set('skills', skills.join(','));
  }
  const response = await authenticatedApiRequest<unknown>(`/jobs?${params}`, { signal });
  return parseJobsPage(response, query);
}
