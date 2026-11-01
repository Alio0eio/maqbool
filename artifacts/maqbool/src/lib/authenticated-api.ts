import { ApiError, customFetch } from '@workspace/api-client-react';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
type ApiRequestOptions = RequestInit & {
  responseType?: 'auto' | 'json' | 'text' | 'blob';
};

let refreshRequest: Promise<void> | undefined;

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
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        throw error;
      }
      throw refreshError;
    }

    return request();
  }
}
