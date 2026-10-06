import { apiFetch } from '@/lib/api-client';
import type {
  CreateFacilityInput,
  FacilitiesListResponse,
  FacilityDto,
  FacilityResponse,
  UpdateFacilityInput,
} from '@vayura/api-contracts/tenancy';

export type { FacilityDto, CreateFacilityInput, UpdateFacilityInput };

export async function listFacilities(orgId: string): Promise<FacilityDto[]> {
  const data = await apiFetch<FacilitiesListResponse>(`/api/v1/organisations/${orgId}/facilities`, {
    method: 'GET',
  });
  return data.facilities;
}

export async function createFacility(
  orgId: string,
  input: CreateFacilityInput,
): Promise<FacilityDto> {
  const data = await apiFetch<FacilityResponse>(`/api/v1/organisations/${orgId}/facilities`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.facility;
}

export async function updateFacility(
  orgId: string,
  facilityId: string,
  input: UpdateFacilityInput,
): Promise<FacilityDto> {
  const data = await apiFetch<FacilityResponse>(
    `/api/v1/organisations/${orgId}/facilities/${facilityId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return data.facility;
}

export async function deleteFacility(orgId: string, facilityId: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/api/v1/organisations/${orgId}/facilities/${facilityId}`, {
    method: 'DELETE',
  });
}
