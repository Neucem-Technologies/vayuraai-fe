export type OffsetSource = 'manual' | 'upload';
export type OffsetStatus = 'held' | 'retired' | 'void';
export type OffsetEnquireStatus = 'open' | 'closed';

export type OffsetRecordDto = {
  id: string;
  organisationId: string;
  source: OffsetSource;
  projectName: string;
  registry: string;
  serial: string;
  quantityTco2e: number;
  vintage: string;
  status: OffsetStatus;
  hasEvidence: boolean;
  evidenceOriginalFilename: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OffsetsListResponse = { offsets: OffsetRecordDto[] };
export type OffsetResponse = { offset: OffsetRecordDto };

export type CreateOffsetInput = {
  projectName: string;
  registry?: string;
  serial?: string;
  quantityTco2e: number;
  vintage?: string;
  status?: OffsetStatus;
  notes?: string;
};

export type UpdateOffsetInput = {
  projectName?: string;
  registry?: string;
  serial?: string;
  quantityTco2e?: number;
  vintage?: string;
  status?: OffsetStatus;
  notes?: string;
};

export type OffsetProjectDto = {
  id: string;
  name: string;
  developer: string;
  type: string;
  location: string;
  registry: string;
  description: string;
};

export type OffsetProjectsListResponse = { projects: OffsetProjectDto[] };

export type CreateOffsetEnquireInput = {
  organisationId: string;
  message: string;
};

export type OffsetEnquireDto = {
  id: string;
  projectId: string;
  organisationId: string;
  message: string;
  status: OffsetEnquireStatus;
  createdAt: string;
};

export type OffsetEnquireResponse = { enquire: OffsetEnquireDto };
