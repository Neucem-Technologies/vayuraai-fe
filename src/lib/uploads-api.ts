import { apiFetch } from '@/lib/api-client';
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

export async function listUploads(orgId: string): Promise<UploadDto[]> {
  const data = await apiFetch<UploadsListResponse>(`/api/v1/organisations/${orgId}/uploads`, {
  });
  return data.uploads;
}

export async function getUploadDetail(orgId: string, uploadId: string): Promise<UploadDetailResponse> {
  return apiFetch<UploadDetailResponse>(
    `/api/v1/organisations/${orgId}/uploads/${uploadId}`,
    {},
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
    },
  );
}

export async function listActivityRecords(orgId: string): Promise<ActivityRecordDto[]> {
  const data = await apiFetch<ActivityRecordsListResponse>(
    `/api/v1/organisations/${orgId}/activity-records`,
    {},
  );
  return data.records;
}

export type UploadContent = {
  blob: Blob;
  mimeType: string;
  filename: string;
  objectUrl: string;
};

/** Fetch original upload bytes for inline preview / download. */
export async function fetchUploadContent(
  orgId: string,
  uploadId: string,
  options?: { download?: boolean },
): Promise<UploadContent> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  if (!baseUrl) throw new Error('VITE_API_BASE_URL is not set.');
  const qs = options?.download ? '?download=1' : '';
  const res = await fetch(
    `${baseUrl}/api/v1/organisations/${orgId}/uploads/${uploadId}/content${qs}`,
    {
      credentials: 'include',
      cache: 'no-store',
    },
  );
  if (!res.ok) {
    let message = 'Could not load the original file.';
    try {
      const json = (await res.json()) as { error?: { message?: string } };
      if (json?.error?.message) message = json.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const mimeType = res.headers.get('content-type') || 'application/octet-stream';
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] ?? 'document';
  const blob = await res.blob();
  return {
    blob,
    mimeType,
    filename,
    objectUrl: URL.createObjectURL(blob),
  };
}
