/** Account type chosen at signup (product persona). */
export type UserType = 'consultant' | 'sme';

/** Workspace access mode (permissions + routing). Not the same as UserType. */
export type AccessKind = 'consultant' | 'client_viewer';

export type OrganisationStatus = 'active' | 'onboarding' | 'paused' | 'archived';
export type ConsolidationApproach = 'operational' | 'financial' | 'equity';
/** Operations consume energy; generation/offset sites produce it (solar, wind, captive power). */
export type FacilityPurpose = 'operations' | 'generation';
export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type TenantRole = 'consultant_admin' | 'consultant_member';
export type OrgRole = 'client_viewer' | 'client_contributor';

export type IngestionStatus =
  | 'queued'
  | 'processing'
  | 'needs_review'
  | 'completed'
  | 'failed';

export type IngestionStepKind =
  | 'extract'
  | 'normalize'
  | 'unit_convert'
  | 'classify'
  | 'factor_lookup'
  | 'calculate';
export type IngestionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

export type AccessPermissions = {
  readOnly: boolean;
  canManageClientPortal: boolean;
  canManageTenant: boolean;
  canAssignConsultants: boolean;
};
