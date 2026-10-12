import { customFetch } from '@workspace/api-client-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export interface CandidateProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  phone?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  summary?: string | null;
  yearsOfExp?: number | null;
  availability?: string | null;
  salaryExpectation?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateProfileInput {
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string[];
  yearsOfExperience?: number | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  summary?: string | null;
  availability?: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return customFetch<T>(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    responseType: 'json',
  });
}

export function getCandidateProfile(signal?: AbortSignal): Promise<CandidateProfile> {
  return request<CandidateProfile>('/candidates/profile', { signal });
}

export function createCandidateProfile(): Promise<CandidateProfile> {
  return request<CandidateProfile>('/candidates/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export function updateCandidateProfile(input: CandidateProfileInput): Promise<CandidateProfile> {
  return request<CandidateProfile>('/candidates/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
