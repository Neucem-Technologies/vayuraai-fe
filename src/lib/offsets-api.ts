import { apiFetch } from '@/lib/api-client';
import type {
  CreateOffsetEnquireInput,
  CreateOffsetInput,
  OffsetEnquireResponse,
  OffsetProjectDto,
  OffsetProjectsListResponse,
  OffsetRecordDto,
  OffsetResponse,
  OffsetsListResponse,
  UpdateOffsetInput,
} from '@vayura/api-contracts/offsets';

export type { OffsetRecordDto, OffsetProjectDto, CreateOffsetInput, UpdateOffsetInput };

export async function listOffsets(orgId: string): Promise<OffsetRecordDto[]> {
  const data = await apiFetch<OffsetsListResponse>(`/api/v1/organisations/${orgId}/offsets`, {
    method: 'GET',
  });
  return data.offsets;
}

export async function createOffset(orgId: string, input: CreateOffsetInput): Promise<OffsetRecordDto> {
  const data = await apiFetch<OffsetResponse>(`/api/v1/organisations/${orgId}/offsets`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.offset;
}

export async function updateOffset(
  orgId: string,
  offsetId: string,
  input: UpdateOffsetInput,
): Promise<OffsetRecordDto> {
  const data = await apiFetch<OffsetResponse>(
    `/api/v1/organisations/${orgId}/offsets/${offsetId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return data.offset;
}

export async function deleteOffset(orgId: string, offsetId: string): Promise<void> {
  await apiFetch<{ deleted: boolean }>(`/api/v1/organisations/${orgId}/offsets/${offsetId}`, {
    method: 'DELETE',
  });
}

export async function attachOffsetEvidence(
  orgId: string,
  offsetId: string,
  file: File,
): Promise<OffsetRecordDto> {
  const form = new FormData();
  form.append('evidence', file);
  const data = await apiFetch<OffsetResponse>(
    `/api/v1/organisations/${orgId}/offsets/${offsetId}/evidence`,
    {
      method: 'POST',
      body: form,
    },
  );
  return data.offset;
}

export async function listOffsetProjects(): Promise<OffsetProjectDto[]> {
  const data = await apiFetch<OffsetProjectsListResponse>('/api/v1/offset-projects', {
    method: 'GET',
  });
  return data.projects;
}

export async function enquireOffsetProject(
  projectId: string,
  input: CreateOffsetEnquireInput,
): Promise<void> {
  await apiFetch<OffsetEnquireResponse>(`/api/v1/offset-projects/${projectId}/enquire`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
