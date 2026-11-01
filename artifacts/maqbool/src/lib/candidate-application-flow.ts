import {
  getApplicationSuccessPath,
  submitJobApplication,
  type CandidateApplicationResponse,
} from './candidate-applications-api';

export async function submitJobApplicationAndNavigate(
  jobId: number,
  coverLetter: string | undefined,
  onSubmitted: (application: CandidateApplicationResponse) => void,
  navigate: (path: string) => void,
): Promise<CandidateApplicationResponse> {
  const application = await submitJobApplication(jobId, coverLetter);
  onSubmitted(application);
  navigate(getApplicationSuccessPath(jobId, application.id));
  return application;
}
