import type { IngestionStatus, IngestionStepKind, IngestionStepStatus } from './common.js';

export type UploadDto = {
  id: string;
  organisationId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: IngestionStatus;
  failureReason: string | null;
  uploadedByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  facilityLabel: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
};

export type PipelineRunDto = {
  id: string;
  currentStep: IngestionStepKind;
  status: IngestionStepStatus;
  attempt: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  /** Steps whose outputs are persisted in stepOutputs. */
  completedSteps: IngestionStepKind[];
};

export type ExtractedLineItemDto = {
  id: string;
  rowIndex: number;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  vendor: string;
  date: string;
  facility: string;
  confidence: 'high' | 'medium' | 'low';
  factorId: string;
  factorName: string;
  factorValue: number;
  factorUnit: string;
  scope: string;
  /** Region of the matched factor row (may differ from org country when GLOBAL fallback is used). */
  factorRegion: string;
  factorRegionCode: string | null;
  factorEffectiveYear: number;
  factorSourceVersion: string;
  factorSourceKey: string;
  factorSourceName: string;
  kgCO2e: number;
  /** Billing unit before spend resolution (e.g. contract, month). */
  originalUnit?: string;
  /** INR spend for billing-unit lines when quantity is not the activity amount. */
  spendAmount?: number;
};

export type UploadsListResponse = { uploads: UploadDto[] };
export type UploadDetailResponse = {
  upload: UploadDto;
  pipeline: PipelineRunDto | null;
  lineItems: ExtractedLineItemDto[];
};
export type UploadCreateResponse = { uploads: UploadDto[] };

export type ReviewLineInput = {
  id: string;
  rowIndex?: number;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  vendor: string;
  date: string;
  facility?: string;
  confidence: 'high' | 'medium' | 'low';
  factorId: string;
  originalUnit?: string;
  spendAmount?: number;
};

export type SaveReviewRequest = { lines: ReviewLineInput[] };
export type SaveReviewResponse = { lineItems: ExtractedLineItemDto[]; savedAt: string };

export type ApproveUploadRequest = { lines?: ReviewLineInput[] };
export type ApproveUploadResponse = {
  upload: UploadDto;
  lineItems: ExtractedLineItemDto[];
  activityRecordCount: number;
  totalKgCO2e: number;
};

export type RejectUploadRequest = { reason: string };
export type RejectUploadResponse = { upload: UploadDto };

export type ActivityRecordDto = {
  id: string;
  organisationId: string;
  documentUploadId: string;
  sourceLineId: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  vendor: string;
  activityDate: string;
  facility: string;
  confidence: 'high' | 'medium' | 'low';
  factorId: string;
  factorName: string;
  factorValue: number;
  factorUnit: string;
  scope: string;
  kgCO2e: number;
  sourceFilename: string;
  approvedByUserId: string;
  approvedAt: string;
};

export type ActivityRecordsListResponse = { records: ActivityRecordDto[] };
