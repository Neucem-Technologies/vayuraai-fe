import { apiFetch } from '@/lib/api-client';
import { TOKEN_KEY } from '@/hooks/use-auth';
import type {
  ActivityRecordDto,
  ActivityRecordsListResponse,
  ApproveUploadRequest,
  ApproveUploadResponse,
  ExtractedLineItemDto,
  RejectUploadRequest,
  RejectUploadResponse,
  ReviewLineInput,
  SaveReviewRequest,
  SaveReviewResponse,
  UploadCreateResponse,
  UploadDetailResponse,
  UploadDto,
  UploadsListResponse,
} from '@vayura/api-contracts/ingestion';
import type { IngestionStatus } from '@vayura/api-contracts/common';

export type {
  UploadDto,
  IngestionStatus,
  ExtractedLineItemDto,
  UploadDetailResponse,
  ReviewLineInput,
  ActivityRecordDto,
};

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function listUploads(orgId: string): Promise<UploadDto[]> {
  const data = await apiFetch<UploadsListResponse>(`/api/v1/organisations/${orgId}/uploads`, {
    accessToken: token(),
  });
  return data.uploads;
}

export async function getUploadDetail(orgId: string, uploadId: string): Promise<UploadDetailResponse> {
  return apiFetch<UploadDetailResponse>(
    `/api/v1/organisations/${orgId}/uploads/${uploadId}`,
    { accessToken: token() },
  );
}

export async function getUpload(orgId: string, uploadId: string): Promise<UploadDto> {
  const data = await getUploadDetail(orgId, uploadId);
  return data.upload;
}

export async function uploadDocuments(
  orgId: string,
  files: File[],
  options?: { allowDuplicate?: boolean; facilityLabel?: string },
): Promise<UploadDto[]> {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }
  if (options?.allowDuplicate) {
    form.append('allowDuplicate', 'true');
  }
  if (options?.facilityLabel?.trim()) {
    form.append('facilityLabel', options.facilityLabel.trim());
  }
  const data = await apiFetch<UploadCreateResponse>(`/api/v1/organisations/${orgId}/uploads`, {
    method: 'POST',
    body: form,
    accessToken: token(),
  });
  return data.uploads;
}

export async function saveUploadReview(
  orgId: string,
  uploadId: string,
  body: SaveReviewRequest,
): Promise<SaveReviewResponse> {
  return apiFetch<SaveReviewResponse>(
    `/api/v1/organisations/${orgId}/uploads/${uploadId}/review`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
      accessToken: token(),
    },
  );
}

export async function approveUpload(
  orgId: string,
  uploadId: string,
  body: ApproveUploadRequest = {},
): Promise<ApproveUploadResponse> {
  return apiFetch<ApproveUploadResponse>(
    `/api/v1/organisations/${orgId}/uploads/${uploadId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken: token(),
    },
  );
}

export async function rejectUpload(
  orgId: string,
  uploadId: string,
  body: RejectUploadRequest,
): Promise<RejectUploadResponse> {
  return apiFetch<RejectUploadResponse>(
    `/api/v1/organisations/${orgId}/uploads/${uploadId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken: token(),
    },
  );
}

export async function listActivityRecords(orgId: string): Promise<ActivityRecordDto[]> {
  const data = await apiFetch<ActivityRecordsListResponse>(
    `/api/v1/organisations/${orgId}/activity-records`,
    { accessToken: token() },
  );
  return data.records;
}
