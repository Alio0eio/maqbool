import { ApiError } from '@workspace/api-client-react';

export type CandidateApplicationErrorKind =
  | 'duplicate-application'
  | 'closed-job'
  | 'profile-required'
  | 'authentication'
  | 'unexpected';

export interface CandidateApplicationError {
  kind: CandidateApplicationErrorKind;
  message: string;
}

function getBackendMessage(error: ApiError): string | undefined {
  const data = error.data;
  if (!data || typeof data !== 'object') return undefined;

  const body = data as { error?: { message?: unknown }; message?: unknown };
  if (typeof body.error?.message === 'string') return body.error.message;
  return typeof body.message === 'string' ? body.message : undefined;
}

export function getCandidateApplicationError(error: unknown): CandidateApplicationError {
  if (error instanceof ApiError) {
    const backendMessage = getBackendMessage(error);

    if (error.status === 409 && backendMessage === 'Application already exists') {
      return {
        kind: 'duplicate-application',
        message: 'You have already applied for this job.',
      };
    }

    if (error.status === 409 && backendMessage === 'Job is not accepting applications') {
      return {
        kind: 'closed-job',
        message: 'This job is no longer accepting applications.',
      };
    }

    if (
      (error.status === 404 && backendMessage === 'Candidate profile not found') ||
      (error.status === 422 &&
        backendMessage === 'Add a valid resume URL to your candidate profile before applying')
    ) {
      return {
        kind: 'profile-required',
        message: 'Complete your candidate profile and add a valid resume before applying.',
      };
    }

    if (error.status === 401) {
      return {
        kind: 'authentication',
        message: 'Your session has expired. Sign in again to continue.',
      };
    }
  }

  return {
    kind: 'unexpected',
    message: 'We couldn’t submit your application. Please try again.',
  };
}
