import { ApiError, customFetch } from '@workspace/api-client-react';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
type ApiRequestOptions = RequestInit & {
  responseType?: 'auto' | 'json' | 'text' | 'blob';
};

let refreshRequest: Promise<void> | undefined;
let sessionExpirationNotified = false;

export const SESSION_EXPIRED_EVENT = 'maqbool:session-expired';

function notifySessionExpired(): void {
  if (sessionExpirationNotified) return;
  sessionExpirationNotified = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

function refreshSession(): Promise<void> {
  if (!refreshRequest) {
    refreshRequest = customFetch<unknown>(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      responseType: 'json',
    })
      .then(() => undefined)
      .finally(() => {
        refreshRequest = undefined;
      });
  }

  return refreshRequest;
}

export async function authenticatedApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const request = () =>
    customFetch<T>(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      responseType: options.responseType ?? 'json',
    });

  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    try {
      await refreshSession();
    } catch {
      notifySessionExpired();
      throw error;
    }

    sessionExpirationNotified = false;
    try {
      return await request();
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        notifySessionExpired();
      }
      throw retryError;
    }
  }
}
