import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedApiRequest } from './authenticated-api';

export interface RecruiterMembership {
  companyId: number;
  companyName: string;
  role: 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'billing_admin';
  status: 'active' | 'invited' | 'inactive';
}

export interface RecruiterContext {
  user: { id: number; name: string; email: string; role: 'recruiter' };
  activeCompany: {
    id: number;
    name: string;
    role: RecruiterMembership['role'];
    capabilities: string[];
  } | null;
  memberships: RecruiterMembership[];
}

export interface RecruiterCompany {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  logoUrl: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  culture: string | null;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterTeamMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: RecruiterMembership['role'];
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string | null;
}

export async function getRecruiterContext(signal?: AbortSignal) {
  return authenticatedApiRequest<RecruiterContext>('/recruiter/context', { signal });
}

export async function selectRecruiterCompany(companyId: number) {
  return authenticatedApiRequest<{ activeCompany: RecruiterContext['activeCompany'] }>(
    '/recruiter/context/active',
    { method: 'POST', body: JSON.stringify({ companyId }), headers: { 'Content-Type': 'application/json' } },
  );
}

export async function getRecruiterCompany(signal?: AbortSignal) {
  const response = await authenticatedApiRequest<{ company: RecruiterCompany }>('/recruiter/company', { signal });
  return response.company;
}

export async function updateRecruiterCompany(patch: Partial<RecruiterCompany>) {
  const response = await authenticatedApiRequest<{ company: RecruiterCompany }>(
    '/recruiter/company',
    { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } },
  );
  return response.company;
}

export async function getRecruiterTeam(signal?: AbortSignal) {
  const response = await authenticatedApiRequest<{ members: RecruiterTeamMember[] }>('/recruiter/team', { signal });
  return response.members;
}

export async function inviteRecruiterTeamMember(email: string, role: 'admin' | 'recruiter' | 'hiring_manager' | 'billing_admin') {
  return authenticatedApiRequest<{ invitation: { id: number; email: string; role: string; expiresAt: string; token: string } }>(
    '/recruiter/invitations',
    { method: 'POST', body: JSON.stringify({ email, role }), headers: { 'Content-Type': 'application/json' } },
  );
}

export async function updateRecruiterTeamMember(memberId: number, role: RecruiterMembership['role']) {
  return authenticatedApiRequest<{ member: RecruiterTeamMember }>(
    `/recruiter/team/${memberId}`,
    { method: 'PATCH', body: JSON.stringify({ role }), headers: { 'Content-Type': 'application/json' } },
  );
}

export async function removeRecruiterTeamMember(memberId: number) {
  return authenticatedApiRequest<{ member: RecruiterTeamMember }>(`/recruiter/team/${memberId}`, { method: 'DELETE' });
}

export function useRecruiterContext() {
  return useQuery({
    queryKey: ['recruiter-context'],
    queryFn: ({ signal }) => getRecruiterContext(signal),
  });
}

export function useRecruiterCompany() {
  return useQuery({
    queryKey: ['recruiter-company'],
    queryFn: ({ signal }) => getRecruiterCompany(signal),
  });
}

export function useRecruiterTeam() {
  return useQuery({
    queryKey: ['recruiter-team'],
    queryFn: ({ signal }) => getRecruiterTeam(signal),
  });
}

export function useRecruiterCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRecruiterCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-company'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-context'] });
    },
  });
}
