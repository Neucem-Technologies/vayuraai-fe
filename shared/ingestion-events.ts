import type { IngestionStatus, IngestionStepKind, IngestionStepStatus } from './common.js';

export const INGESTION_STEP_ORDER = [
  'extract',
  'normalize',
  'unit_convert',
  'classify',
  'factor_lookup',
  'calculate',
] as const satisfies readonly IngestionStepKind[];

export const INGESTION_STEP_LABELS: Record<IngestionStepKind, string> = {
  extract: 'Extraction',
  normalize: 'Normalization',
  unit_convert: 'Standard unit conversion',
  classify: 'Classification',
  factor_lookup: 'Emission factor lookup',
  calculate: 'Emission calculation',
};

export type IngestionPipelineEventBase = {
  uploadId: string;
  organisationId: string;
  tenantId: string;
  originalFilename: string;
};

export type UploadStatusEvent = IngestionPipelineEventBase & {
  type: 'upload_status';
  uploadStatus: IngestionStatus;
};

export type StepStartedEvent = IngestionPipelineEventBase & {
  type: 'step_started';
  step: IngestionStepKind;
  stepLabel: string;
  uploadStatus: IngestionStatus;
  pipelineStatus: IngestionStepStatus;
};

export type StepCompletedEvent = IngestionPipelineEventBase & {
  type: 'step_completed';
  step: IngestionStepKind;
  stepLabel: string;
  uploadStatus: IngestionStatus;
  pipelineStatus: IngestionStepStatus;
  completedSteps: IngestionStepKind[];
};

export type PipelineCompletedEvent = IngestionPipelineEventBase & {
  type: 'pipeline_completed';
  uploadStatus: 'completed' | 'needs_review';
  lineCount: number;
  message: string;
};

export type PipelineFailedEvent = IngestionPipelineEventBase & {
  type: 'pipeline_failed';
  step: IngestionStepKind;
  stepLabel: string;
  message: string;
  uploadStatus: 'failed';
};

export type IngestionPipelineEvent =
  | UploadStatusEvent
  | StepStartedEvent
  | StepCompletedEvent
  | PipelineCompletedEvent
  | PipelineFailedEvent;
