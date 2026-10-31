import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@workspace/api-client-react';
import { toast } from '@workspace/design-system/hooks/use-toast';
import {
  candidateJobQueryKey,
  candidateSavedJobsQueryKey,
  saveCandidateJob,
  unsaveCandidateJob,
} from './candidate-jobs-api';

interface SaveJobVariables {
  jobId: number;
  isSaved: boolean;
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === 'object') {
      const body = data as { error?: { message?: unknown }; message?: unknown };
      if (typeof body.error?.message === 'string') return body.error.message;
      if (typeof body.message === 'string') return body.message;
    }
  }

  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}

export function useCandidateJobSave(candidateId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, isSaved }: SaveJobVariables) =>
      isSaved ? unsaveCandidateJob(jobId) : saveCandidateJob(jobId),
    onSuccess: async (_result, { jobId, isSaved }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateSavedJobsQueryKey(candidateId) }),
        queryClient.invalidateQueries({ queryKey: candidateJobQueryKey(jobId, candidateId) }),
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
      ]);
      toast({
        title: isSaved ? 'Job removed from saved jobs' : 'Job saved',
        description: isSaved
          ? 'The job was removed from your saved list.'
          : 'The job was added to your saved list.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Unable to update saved job',
        description: getApiErrorMessage(error),
      });
    },
  });
}
