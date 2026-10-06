import type { UploadDoc, UploadStatus } from '@/lib/mock-data';
import type { IngestionStatus, UploadDto } from '@/lib/uploads-api';
import { displayFacility } from '@/lib/facilities';

export function mapIngestionStatus(status: IngestionStatus, reviewedAt?: string | null): UploadStatus {
  if (reviewedAt) return 'Posted';
  switch (status) {
    case 'queued':
    case 'processing':
      return 'Processing';
    case 'needs_review':
      return 'Needs Review';
    case 'completed':
      // Pipeline finished; still needs Approve to post to the emissions ledger.
      return 'Ready to Approve';
    case 'failed':
      return 'Failed';
  }
}

function mapFileType(mimeType: string, filename: string): UploadDoc['type'] {
  const lower = filename.toLowerCase();
  if (mimeType.includes('spreadsheet') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return 'Excel';
  }
  if (mimeType.includes('csv') || lower.endsWith('.csv')) return 'CSV';
  return 'PDF';
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function uploadDtoToDoc(
  row: UploadDto,
  uploadedBy = 'You',
  lineItemCount?: number,
): UploadDoc {
  return {
    id: row.id,
    filename: row.originalFilename,
    type: mapFileType(row.mimeType, row.originalFilename),
    uploadedBy,
    size: formatSize(row.sizeBytes),
    date: row.createdAt,
    periodStart: `${row.periodStart}T00:00:00.000Z`,
    periodEnd: `${row.periodEnd}T00:00:00.000Z`,
    status: mapIngestionStatus(row.status, row.reviewedAt),
    facility: displayFacility(row.facilityLabel),
    category: row.reviewedAt
      ? 'Posted to ledger'
      : row.status === 'completed' || row.status === 'needs_review'
        ? 'Ready to approve'
        : row.status === 'failed'
          ? 'Failed'
          : 'Processing',
    lineItemCount: lineItemCount ?? row.lineItemCount ?? 0,
  };
}
