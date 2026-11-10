import { useQueries } from '@tanstack/react-query';
import {
  candidateApplicationDetailsQueryKey,
  type CandidateApplicationDetails,
  getCandidateApplicationDetails,
} from './candidate-applications-api';
import { useCandidateApplications } from './use-candidate-applications';

export interface CandidateInterviewWithApplication {
  application: CandidateApplicationDetails;
  interview: NonNullable<CandidateApplicationDetails['interview']>;
}

export function useCandidateInterviews(candidateId: number, enabled: boolean) {
  const applicationsQuery = useCandidateApplications(candidateId, enabled);
  const applications = (applicationsQuery.data ?? []).filter(
    (application) => application.status === 'interviewing' || application.stage === 'interview',
  );
  const applicationDetailQueries = useQueries({
    queries: applications.map((application) => ({
      queryKey: candidateApplicationDetailsQueryKey(candidateId, application.id),
      queryFn: ({ signal }) => getCandidateApplicationDetails(application.id, signal),
      enabled: enabled && applicationsQuery.isSuccess,
      retry: 1,
    })),
  });
  const isPending =
    applicationsQuery.isPending || applicationDetailQueries.some((query) => query.isPending);
  const isError =
    applicationsQuery.isError || applicationDetailQueries.some((query) => query.isError);
  const data: CandidateInterviewWithApplication[] | undefined =
    isPending || isError
      ? undefined
      : applicationDetailQueries.flatMap((query) => {
          const application = query.data;
          return application?.interview
            ? [{ application, interview: application.interview }]
            : [];
        });

  return {
    data,
    isPending,
    isError,
    isFetching:
      applicationsQuery.isFetching ||
      applicationDetailQueries.some((query) => query.isFetching),
    refetch: async () => {
      await Promise.all([
        applicationsQuery.refetch(),
        ...applicationDetailQueries.map((query) => query.refetch()),
      ]);
    },
  };
}
