import { authenticatedApiRequest } from './authenticated-api';

export interface CandidateApplication {
  id: number;
  status: string;
  stage: string;
  appliedAt?: string | null;
  createdAt: string;
  job: {
    id: number;
    title: string;
    location: string;
    company: {
      name: string;
      logoUrl?: string | null;
    };
  };
}

export interface CandidateApplicationDetails extends CandidateApplication {
  updatedAt: string;
  feedback: string | null;
  interview: {
    id: number;
    type: string;
    status: string;
    scheduledAt: string | null;
    deadline: string | null;
    durationMinutes: number | null;
    invitationNote: string | null;
  } | null;
}

interface ApplicationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CandidateApplicationsPage {
  applications: CandidateApplication[];
  pagination: ApplicationsPagination;
}

export interface CandidateApplicationResponse {
  id: number;
  jobId: number;
  candidateId: number;
  status: string;
  stage: string;
  resumeUrl: string;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isCandidateApplication(value: unknown): value is CandidateApplication {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.status !== 'string' ||
    !value.status ||
    typeof value.stage !== 'string' ||
    !value.stage ||
    typeof value.createdAt !== 'string' ||
    !isRecord(value.job) ||
    !isPositiveInteger(value.job.id) ||
    typeof value.job.title !== 'string' ||
    typeof value.job.location !== 'string' ||
    !isRecord(value.job.company) ||
    typeof value.job.company.name !== 'string' ||
    (value.job.company.logoUrl !== undefined &&
      value.job.company.logoUrl !== null &&
      typeof value.job.company.logoUrl !== 'string') ||
    (value.appliedAt !== undefined &&
      value.appliedAt !== null &&
      typeof value.appliedAt !== 'string')
  ) {
    return false;
  }

  return true;
}

export function parseCandidateApplicationsPage(
  value: unknown,
  expectedPage: number,
  limit: number,
): CandidateApplicationsPage {
  if (!isRecord(value) || !Array.isArray(value.applications) || !isRecord(value.pagination)) {
    throw new Error('The applications service returned an invalid response.');
  }

  const { page, limit: responseLimit, total, totalPages } = value.pagination;
  if (
    page !== expectedPage ||
    responseLimit !== limit ||
    typeof total !== 'number' ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    typeof totalPages !== 'number' ||
    !Number.isSafeInteger(totalPages) ||
    totalPages !== Math.ceil(total / limit) ||
    !value.applications.every(isCandidateApplication)
  ) {
    throw new Error('The applications service returned an invalid response.');
  }

  return {
    applications: value.applications,
    pagination: { page, limit, total, totalPages },
  };
}

export function candidateApplicationsQueryKey(candidateId: number) {
  return ['candidate-applications', candidateId] as const;
}

export function candidateApplicationDetailsQueryKey(candidateId: number, applicationId: number) {
  return ['candidate-application', candidateId, applicationId] as const;
}

export async function getCandidateApplications(signal?: AbortSignal): Promise<CandidateApplication[]> {
  const limit = 100;
  const getPage = async (page: number) => {
    const response = await authenticatedApiRequest<unknown>(
      `/candidates/applications?page=${page}&limit=${limit}`,
      { signal },
    );
    return parseCandidateApplicationsPage(response, page, limit);
  };

  const firstPage = await getPage(1);
  const applications = [...firstPage.applications];
  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const result = await getPage(page);
    if (
      result.pagination.total !== firstPage.pagination.total ||
      result.pagination.totalPages !== firstPage.pagination.totalPages
    ) {
      throw new Error('Applications changed while the results were loading. Please try again.');
    }
    applications.push(...result.applications);
  }
  return applications;
}

export async function getCandidateApplicationDetails(
  applicationId: number,
  signal?: AbortSignal,
): Promise<CandidateApplicationDetails> {
  if (!isPositiveInteger(applicationId)) {
    throw new Error('A valid application ID is required.');
  }

  const response = await authenticatedApiRequest<unknown>(`/applications/${applicationId}`, { signal });
  if (
    !isRecord(response) ||
    !isCandidateApplication(response) ||
    typeof response.updatedAt !== 'string' ||
    (response.feedback !== null && typeof response.feedback !== 'string') ||
    !('interview' in response)
  ) {
    throw new Error('The application service returned an invalid response.');
  }

  let interview: CandidateApplicationDetails['interview'] = null;
  if (response.interview !== null) {
    const interviewData = response.interview;
    if (
      !isRecord(interviewData) ||
      !isPositiveInteger(interviewData.id) ||
      typeof interviewData.type !== 'string' ||
      typeof interviewData.status !== 'string' ||
      (interviewData.scheduledAt !== null && typeof interviewData.scheduledAt !== 'string') ||
      (interviewData.deadline !== null && typeof interviewData.deadline !== 'string') ||
      (interviewData.durationMinutes !== null && typeof interviewData.durationMinutes !== 'number') ||
      (interviewData.invitationNote !== null && typeof interviewData.invitationNote !== 'string')
    ) {
      throw new Error('The application service returned an invalid response.');
    }

    interview = {
      id: interviewData.id,
      type: interviewData.type,
      status: interviewData.status,
      scheduledAt: interviewData.scheduledAt,
      deadline: interviewData.deadline,
      durationMinutes: interviewData.durationMinutes,
      invitationNote: interviewData.invitationNote,
    };
  }

  const feedback = response.feedback;
  return {
    ...response,
    updatedAt: response.updatedAt,
    feedback,
    interview,
  };
}

export function parseCandidateApplicationResponse(value: unknown): CandidateApplicationResponse {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    value.id <= 0 ||
    typeof value.jobId !== 'number' ||
    !Number.isSafeInteger(value.jobId) ||
    value.jobId <= 0 ||
    typeof value.candidateId !== 'number' ||
    !Number.isSafeInteger(value.candidateId) ||
    value.candidateId <= 0 ||
    typeof value.status !== 'string' ||
    typeof value.stage !== 'string' ||
    typeof value.resumeUrl !== 'string' ||
    (value.coverLetter !== null && typeof value.coverLetter !== 'string') ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    throw new Error('The applications service returned an invalid response.');
  }

  return {
    id: value.id,
    jobId: value.jobId,
    candidateId: value.candidateId,
    status: value.status,
    stage: value.stage,
    resumeUrl: value.resumeUrl,
    coverLetter: value.coverLetter,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function getApplicationSuccessPath(jobId: number, applicationId: number): string {
  if (
    !Number.isSafeInteger(jobId) ||
    jobId <= 0 ||
    !Number.isSafeInteger(applicationId) ||
    applicationId <= 0
  ) {
    throw new Error('A valid job and application ID are required.');
  }

  return `/candidate/apply/${jobId}/success?applicationId=${applicationId}`;
}

export async function submitJobApplication(
  jobId: number,
  coverLetter?: string,
): Promise<CandidateApplicationResponse> {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new Error('A valid job ID is required.');
  }

  const response = await authenticatedApiRequest<unknown>(`/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coverLetter ? { coverLetter } : {}),
  });

  return parseCandidateApplicationResponse(response);
}
