import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { ApiError } from '@workspace/api-client-react';
import {
  getCandidateApplicationError,
  type CandidateApplicationErrorKind,
} from './candidate-application-errors';

function apiError(status: number, message: string): ApiError {
  return new ApiError(
    new Response(null, { status }),
    { error: { message } },
    { method: 'POST', url: '/api/jobs/42/apply' },
  );
}

describe('candidate application error handling', () => {
  it('distinguishes duplicate, closed-job, profile, and authentication failures', () => {
    const cases: Array<[ApiError, CandidateApplicationErrorKind, string]> = [
      [
        apiError(409, 'Application already exists'),
        'duplicate-application',
        'You have already applied for this job.',
      ],
      [
        apiError(409, 'Job is not accepting applications'),
        'closed-job',
        'This job is no longer accepting applications.',
      ],
      [
        apiError(404, 'Candidate profile not found'),
        'profile-required',
        'Complete your candidate profile and add a valid resume before applying.',
      ],
      [
        apiError(422, 'Add a valid resume URL to your candidate profile before applying'),
        'profile-required',
        'Complete your candidate profile and add a valid resume before applying.',
      ],
      [
        apiError(401, 'Authentication required'),
        'authentication',
        'Your session has expired. Sign in again to continue.',
      ],
    ];

    for (const [error, kind, message] of cases) {
      assert.deepEqual(getCandidateApplicationError(error), { kind, message });
    }
  });

  it('does not classify unrelated conflicts or expose unexpected backend details', () => {
    assert.deepEqual(getCandidateApplicationError(apiError(409, 'A different conflict')), {
      kind: 'unexpected',
      message: 'We couldn’t submit your application. Please try again.',
    });
    assert.deepEqual(
      getCandidateApplicationError(new Error('Internal stack trace detail')),
      {
        kind: 'unexpected',
        message: 'We couldn’t submit your application. Please try again.',
      },
    );
  });
});
