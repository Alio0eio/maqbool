import { authenticatedApiRequest } from './authenticated-api';

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

export type CandidateCvProfileInput = Omit<CandidateProfileInput, 'phone'>;

export interface ResumeImportResult {
  resumeUrl: string;
  extractedFields: CandidateCvProfileInput;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return authenticatedApiRequest<T>(path, options);
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

export function parseCandidateCv(file: File): Promise<ResumeImportResult> {
  const formData = new FormData();
  formData.set('resume', file);
  return request<ResumeImportResult>('/candidates/parse-cv', {
    method: 'POST',
    body: formData,
  });
}

export function getCandidateResumeHref(resumeUrl?: string | null): string | undefined {
  if (!resumeUrl) return undefined;
  if (resumeUrl.startsWith('/api/candidates/profile/resume/')) {
    return `${API_BASE_URL}${resumeUrl.slice('/api'.length)}`;
  }
  return resumeUrl;
}
