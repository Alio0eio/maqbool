import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { ApiError } from '@workspace/api-client-react';
import { toast } from '@workspace/design-system/hooks/use-toast';
import {
  candidateApplicationDetailsQueryKey,
  candidateApplicationsQueryKey,
  withdrawCandidateApplication,
} from './candidate-applications-api';
import { candidateJobQueryKey } from './candidate-jobs-api';

export interface WithdrawCandidateApplicationVariables {
  applicationId: number;
  jobId: number;
}

function getWithdrawalErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'Your session has expired. Sign in again to continue.';
      case 404:
        return 'We couldn’t find this application. Your application data has not been changed.';
      case 409:
        return 'This application can no longer be withdrawn. Your application status is being refreshed.';
    }
  }

  return 'We couldn’t withdraw this application. Check your connection and try again.';
}

export function useCandidateApplicationWithdrawal(candidateId: number) {
  const queryClient = useQueryClient();
  const submissionPending = useRef(false);

  const mutation = useMutation({
    mutationFn: ({ applicationId }: WithdrawCandidateApplicationVariables) =>
      withdrawCandidateApplication(applicationId),
    onSuccess: async (_application, { applicationId, jobId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: candidateApplicationsQueryKey(candidateId),
        }),
        queryClient.invalidateQueries({
          queryKey: candidateApplicationDetailsQueryKey(candidateId, applicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: candidateJobQueryKey(jobId, candidateId),
        }),
      ]);
      toast({
        title: 'Application withdrawn',
        description: 'Your application remains in your history with its updated status.',
      });
    },
    onError: async (error, { applicationId, jobId }) => {
      if (error instanceof ApiError && error.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: candidateApplicationsQueryKey(candidateId),
          }),
          queryClient.invalidateQueries({
            queryKey: candidateApplicationDetailsQueryKey(candidateId, applicationId),
          }),
          queryClient.invalidateQueries({
            queryKey: candidateJobQueryKey(jobId, candidateId),
          }),
        ]);
      }

      toast({
        title: 'Unable to withdraw application',
        description: getWithdrawalErrorMessage(error),
      });
    },
  });

  const withdraw = (variables: WithdrawCandidateApplicationVariables) => {
    if (submissionPending.current) return;
    submissionPending.current = true;
    mutation.mutate(variables, {
      onSettled: () => {
        submissionPending.current = false;
      },
    });
  };

  return { ...mutation, withdraw };
}
