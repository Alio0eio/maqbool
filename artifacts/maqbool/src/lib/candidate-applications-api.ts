import { authenticatedApiRequest } from './authenticated-api';

export interface CandidateApplication {
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

export async function submitJobApplication(
  jobId: number,
  coverLetter?: string,
): Promise<CandidateApplication> {
  return authenticatedApiRequest<CandidateApplication>(`/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coverLetter ? { coverLetter } : {}),
  });
}
