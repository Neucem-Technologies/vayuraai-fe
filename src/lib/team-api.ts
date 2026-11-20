
import { apiFetch } from '@/lib/api-client';
import type {
  InviteTeamMemberResponse,
  TeamMemberDto,
} from '@vayura/api-contracts/tenancy';
import type {
  PermissionCode,
  TenantRole,
} from '@vayura/api-contracts/common';

type TeamMemberWithPermissions = TeamMemberDto & {
  permissionCodes: PermissionCode[];
  assignedOrgIds: string[];
};

export async function listTeamMembers(): Promise<TeamMemberWithPermissions[]> {
  const data = await apiFetch<{
    members: TeamMemberWithPermissions[];
  }>('/api/v1/tenant/members');

  return data.members;
}

export async function inviteTeamMember(input: {
  email: string;
  fullName: string;
  role: TenantRole;
  permissionCodes?: PermissionCode[];
}): Promise<InviteTeamMemberResponse> {
  return apiFetch<InviteTeamMemberResponse>('/api/v1/tenant/members', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTeamMemberRole(
  userId: string,
  role: TenantRole,
  permissionCodes?: PermissionCode[],
): Promise<void> {
  await apiFetch<{ updated: boolean }>(`/api/v1/tenant/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role, permissionCodes }),
  });
}

export async function removeTeamMember(userId: string): Promise<void> {
  await apiFetch<{ removed: boolean }>(`/api/v1/tenant/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function assignClientToMember(
  orgId: string,
  userId: string,
): Promise<void> {
  await apiFetch<{ assigned: boolean }>(
    `/api/v1/consultant/orgs/${orgId}/assign-member`,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
}

export async function unassignClientFromMember(
  orgId: string,
  userId: string,
): Promise<void> {
  await apiFetch<{ unassigned: boolean }>(
    `/api/v1/consultant/orgs/${orgId}/assign-member/${userId}`,
    { method: 'DELETE' },
  );
}
