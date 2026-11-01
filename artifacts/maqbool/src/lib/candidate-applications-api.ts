import { authenticatedApiRequest } from './authenticated-api';

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
