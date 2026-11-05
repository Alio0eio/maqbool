import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { ApiError } from '@workspace/api-client-react';
import { authenticatedApiRequest } from './authenticated-api';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authenticated API requests', () => {
  it('refreshes an expired access token and retries the original request once', async () => {
    let applicationAttempts = 0;
    let refreshAttempts = 0;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        return jsonResponse({ accessToken: 'refreshed' }, 200);
      }

      applicationAttempts += 1;
      return applicationAttempts === 1
        ? jsonResponse({ error: { message: 'Authentication required' } }, 401)
        : jsonResponse({ applicationId: 518 }, 201);
    };

    const result = await authenticatedApiRequest<{ applicationId: number }>(
      '/jobs/42/apply',
      { method: 'POST' },
    );

    assert.deepEqual(result, { applicationId: 518 });
    assert.equal(applicationAttempts, 2);
    assert.equal(refreshAttempts, 1);
  });

  it('does not retry the original request when refresh fails', async () => {
    let applicationAttempts = 0;
    let refreshAttempts = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        return jsonResponse({ error: { message: 'Invalid refresh token' } }, 401);
      }

      applicationAttempts += 1;
      return jsonResponse({ error: { message: 'Authentication required' } }, 401);
    };

    await assert.rejects(
      authenticatedApiRequest('/jobs/42/apply', { method: 'POST' }),
      (error: unknown) => error instanceof ApiError && error.status === 401,
    );

    assert.equal(applicationAttempts, 1);
    assert.equal(refreshAttempts, 1);
  });

  it('does not refresh or retry requests that fail with another status', async () => {
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;
      return jsonResponse({ error: { message: 'Application already exists' } }, 409);
    };

    await assert.rejects(
      authenticatedApiRequest('/jobs/42/apply', { method: 'POST' }),
      (error: unknown) => error instanceof ApiError && error.status === 409,
    );

    assert.equal(attempts, 1);
  });

  it('shares one refresh operation across concurrent unauthorized requests', async () => {
    let refreshAttempts = 0;
    let applicationAttempts = 0;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshAttempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return jsonResponse({ accessToken: 'refreshed' }, 200);
      }

      applicationAttempts += 1;
      return applicationAttempts <= 2
        ? jsonResponse({ error: { message: 'Authentication required' } }, 401)
        : jsonResponse({ ok: true }, 200);
    };

    const results = await Promise.all([
      authenticatedApiRequest('/jobs/42/apply', { method: 'POST' }),
      authenticatedApiRequest('/jobs/43/apply', { method: 'POST' }),
    ]);

    assert.deepEqual(results, [{ ok: true }, { ok: true }]);
    assert.equal(refreshAttempts, 1);
    assert.equal(applicationAttempts, 4);
  });
});
