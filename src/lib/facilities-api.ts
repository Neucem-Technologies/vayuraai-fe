import { apiFetch } from '@/lib/api-client';
import type {
  CreateFacilityInput,
  FacilitiesListResponse,
  FacilityDto,
  FacilityResponse,
  UpdateFacilityInput,
} from '@vayura/api-contracts/tenancy';

const ACCESS_TOKEN_KEY = 'vayura_access_token';

export type { FacilityDto, CreateFacilityInput, UpdateFacilityInput };

function token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function listFacilities(orgId: string): Promise<FacilityDto[]> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<FacilitiesListResponse>(`/api/v1/organisations/${orgId}/facilities`, {
    method: 'GET',
    accessToken,
  });
  return data.facilities;
}

export async function createFacility(
  orgId: string,
  input: CreateFacilityInput,
): Promise<FacilityDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<FacilityResponse>(`/api/v1/organisations/${orgId}/facilities`, {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
  return data.facility;
}

export async function updateFacility(
  orgId: string,
  facilityId: string,
  input: UpdateFacilityInput,
): Promise<FacilityDto> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  const data = await apiFetch<FacilityResponse>(
    `/api/v1/organisations/${orgId}/facilities/${facilityId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
      accessToken,
    },
  );
  return data.facility;
}

export async function deleteFacility(orgId: string, facilityId: string): Promise<void> {
  const accessToken = token();
  if (!accessToken) throw new Error('Not authenticated');
  await apiFetch<{ deleted: boolean }>(`/api/v1/organisations/${orgId}/facilities/${facilityId}`, {
    method: 'DELETE',
    accessToken,
  });
}
