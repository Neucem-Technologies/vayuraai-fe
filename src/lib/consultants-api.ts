import { apiFetch } from '@/lib/api-client';
import type {
  ConsultantEnquireResponse,
  CreateConsultantEnquireInput,
  ListedConsultantDto,
  ListedConsultantsResponse,
  UpdateTenantListingInput,
} from '@vayura/api-contracts/consultants';
import type { TenantDto, TenantBrandingResponse } from '@vayura/api-contracts/tenancy';

export type { ListedConsultantDto };

export async function listListedConsultants(): Promise<ListedConsultantDto[]> {
  const data = await apiFetch<ListedConsultantsResponse>('/api/v1/consultants', {
    method: 'GET',
  });
  return data.consultants;
}

export async function enquireConsultant(
  tenantId: string,
  input: CreateConsultantEnquireInput,
): Promise<void> {
  await apiFetch<ConsultantEnquireResponse>(`/api/v1/consultants/${tenantId}/enquire`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTenantListing(input: UpdateTenantListingInput): Promise<TenantDto> {
  const data = await apiFetch<TenantBrandingResponse>('/api/v1/tenant/listing', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.tenant;
}
