import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { ApiError } from '@workspace/api-client-react';
import { submitJobApplicationAndNavigate } from './candidate-application-flow';

const originalFetch = globalThis.fetch;

function applicationResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 518,
    jobId: 42,
    candidateId: 7,
    status: 'applied',
    stage: 'applied',
    resumeUrl: 'https://example.com/resume.pdf',
    coverLetter: 'I am interested in this role.',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('candidate application submission flow', () => {
  it('accepts HTTP 201 and navigates to the success step with the returned application ID', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(applicationResponse()), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

    let submittedApplicationId: number | undefined;
    let successPath: string | undefined;

    const application = await submitJobApplicationAndNavigate(
      42,
      'I am interested in this role.',
      (submitted) => {
        submittedApplicationId = submitted.id;
      },
      (path) => {
        successPath = path;
      },
    );

    assert.equal(application.id, 518);
    assert.equal(submittedApplicationId, 518);
    assert.equal(successPath, '/candidate/apply/42/success?applicationId=518');
  });

  it('uses the flat application object returned by the backend', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(applicationResponse()), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

    const application = await submitJobApplicationAndNavigate(42, undefined, () => {}, () => {});

    assert.equal(application.id, 518);
    assert.equal(application.jobId, 42);
    assert.equal(application.candidateId, 7);
    assert.equal(application.resumeUrl, 'https://example.com/resume.pdf');
    assert.equal(application.coverLetter, 'I am interested in this role.');
  });

  it('does not call success handlers or navigate when the request fails', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Application already exists' } }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });

    let successHandled = false;
    let navigated = false;

    await assert.rejects(
      submitJobApplicationAndNavigate(
        42,
        undefined,
        () => {
          successHandled = true;
        },
        () => {
          navigated = true;
        },
      ),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 409);
        return true;
      },
    );

    assert.equal(successHandled, false);
    assert.equal(navigated, false);
  });

  it('does not navigate when a successful response is missing a valid application ID', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(applicationResponse({ id: undefined })), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });

    let successHandled = false;
    let navigated = false;

    await assert.rejects(
      submitJobApplicationAndNavigate(
        42,
        undefined,
        () => {
          successHandled = true;
        },
        () => {
          navigated = true;
        },
      ),
      /invalid response/i,
    );

    assert.equal(successHandled, false);
    assert.equal(navigated, false);
  });
});
