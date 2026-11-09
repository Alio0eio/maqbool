import { useQuery } from '@tanstack/react-query';
import {
  candidateApplicationsQueryKey,
  getCandidateApplications,
} from './candidate-applications-api';

export function useCandidateApplications(candidateId: number, enabled: boolean) {
  return useQuery({
    queryKey: candidateApplicationsQueryKey(candidateId),
    queryFn: ({ signal }) => getCandidateApplications(signal),
    enabled: enabled && Number.isSafeInteger(candidateId) && candidateId > 0,
    retry: 1,
  });
}
