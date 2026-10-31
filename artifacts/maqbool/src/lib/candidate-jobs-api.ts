import type { Job } from '@workspace/api-client-react';
import { authenticatedApiRequest } from './authenticated-api';
import {
  isCandidateJob,
  parseCandidateSavedJobsPage,
  parseCandidateJobDetails,
  type CandidateJobDetails,
  type CandidateSavedJob,
} from './candidate-job-details';

export { getApplicationStatusLabel, parseCandidateJobDetails, parseCandidateSavedJobsPage } from './candidate-job-details';
export type { CandidateJobDetails, CandidateSavedJob } from './candidate-job-details';

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

export function candidateJobQueryKey(jobId: number, candidateId: number) {
  return ['candidate-job', jobId, candidateId] as const;
}

export function candidateSavedJobsQueryKey(candidateId: number) {
  return ['saved-jobs', candidateId] as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function getCandidateSavedJobs(signal?: AbortSignal): Promise<CandidateSavedJob[]> {
  const limit = 100;
  const getPage = async (page: number) => {
    const response = await authenticatedApiRequest<unknown>(
      `/candidates/saved-jobs?page=${page}&limit=${limit}`,
      { signal },
    );
    return parseCandidateSavedJobsPage(response, page, limit);
  };

  const firstPage = await getPage(1);
  const savedJobs = [...firstPage.jobs];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const result = await getPage(page);
    if (
      result.pagination.total !== firstPage.pagination.total ||
      result.pagination.totalPages !== firstPage.pagination.totalPages
    ) {
      throw new Error('The saved-jobs service changed while the results were being loaded. Please try again.');
    }
    savedJobs.push(...result.jobs);
  }
  return savedJobs;
}

export async function saveCandidateJob(jobId: number): Promise<unknown> {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new Error('A valid job ID is required.');
  }
  return authenticatedApiRequest<unknown>(`/jobs/${jobId}/save`, { method: 'POST' });
}

export async function unsaveCandidateJob(jobId: number): Promise<unknown> {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new Error('A valid job ID is required.');
  }
  return authenticatedApiRequest<unknown>(`/jobs/${jobId}/save`, { method: 'DELETE' });
}

export async function getCandidateJobDetails(
  jobId: number,
  signal?: AbortSignal,
): Promise<CandidateJobDetails> {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new Error('A valid job ID is required.');
  }

  const response = await authenticatedApiRequest<unknown>(`/jobs/${jobId}`, { signal });
  return parseCandidateJobDetails(response);
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
    !value.jobs.every(isCandidateJob)
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
