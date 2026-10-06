import { apiFetch } from '@/lib/api-client';
import type { InviteTeamMemberResponse, TeamMemberDto, TeamMembersResponse } from '@vayura/api-contracts/tenancy';
import type { TenantRole } from '@vayura/api-contracts/common';

export async function listTeamMembers(): Promise<TeamMemberDto[]> {
  const data = await apiFetch<TeamMembersResponse>('/api/v1/tenant/members');
  return data.members;
}

export async function inviteTeamMember(input: {
  email: string;
  fullName: string;
  role: TenantRole;
}): Promise<InviteTeamMemberResponse> {
  return apiFetch<InviteTeamMemberResponse>('/api/v1/tenant/members', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTeamMemberRole(userId: string, role: TenantRole): Promise<void> {
  await apiFetch<{ updated: boolean }>(`/api/v1/tenant/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeTeamMember(userId: string): Promise<void> {
  await apiFetch<{ removed: boolean }>(`/api/v1/tenant/members/${userId}`, {
    method: 'DELETE',
  });
}
