import { apiFetch } from '@/lib/api-client';
import { fetchMe } from '@/lib/auth-api';
import type {
  CreateOrganisationInput,
  OrganisationDto,
  OrganisationResponse,
  OrganisationsListResponse,
  UpdateOrganisationInput,
} from '@vayura/api-contracts/tenancy';
import type { MeProfile, AccessProfile } from '@vayura/api-contracts/auth';
import type { TenantPlan, TenantRole } from '@vayura/api-contracts/common';

export type {
  OrganisationDto,
  MeProfile,
  AccessProfile,
  CreateOrganisationInput,
  UpdateOrganisationInput,
  TenantPlan,
  TenantRole,
};
export type OrganisationStatus = OrganisationDto['status'];

export async function fetchMeProfile(): Promise<MeProfile> {
  return fetchMe();
}

export async function listOrganisations(): Promise<OrganisationDto[]> {
  const data = await apiFetch<OrganisationsListResponse>('/api/v1/organisations', {
    method: 'GET',
  });
  return data.organisations;
}

export async function createOrganisation(input: CreateOrganisationInput): Promise<OrganisationDto> {
  const data = await apiFetch<OrganisationResponse>('/api/v1/organisations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.organisation;
}

export async function updateOrganisation(
  orgId: string,
  input: UpdateOrganisationInput,
): Promise<OrganisationDto> {
  const data = await apiFetch<OrganisationResponse>(`/api/v1/organisations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.organisation;
}

export async function getOrganisation(orgId: string): Promise<OrganisationDto> {
  const data = await apiFetch<OrganisationResponse>(`/api/v1/organisations/${orgId}`, {
    method: 'GET',
  });
  return data.organisation;
}
