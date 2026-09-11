export type EmissionFactorDto = {
  id: string;
  slug: string;
  name: string;
  category: string;
  scope: string;
  value: number;
  activityUnit: string;
  factorUnit: string;
  region: string;
  regionCode: string | null;
  effectiveYear: number;
  sourceVersion: string;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string | null;
  datasetVersion: string | null;
  validFrom: string | null;
  validTo: string | null;
};

export type EmissionFactorsListResponse = {
  factors: EmissionFactorDto[];
  region: string;
  year: number;
};

export type CreateCustomEmissionFactorInput = {
  name: string;
  category: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  value: number;
  activityUnit: string;
  region?: string;
  regionCode?: string;
  effectiveYear?: number;
  validFrom?: string | null;
  validTo?: string | null;
};

export type EmissionFactorResponse = { factor: EmissionFactorDto };

export type BulkImportEmissionFactorsInput = {
  factors: CreateCustomEmissionFactorInput[];
};

export type BulkImportEmissionFactorsResponse = {
  imported: number;
  failed: number;
  factors: EmissionFactorDto[];
  errors: { index: number; name?: string; message: string }[];
};

export type ParseEmissionFactorsFileResponse = {
  factors: CreateCustomEmissionFactorInput[];
  filename: string;
};

export type EmissionFactorSyncResponse = {
  sources: {
    sourceKey: string;
    upserted: number;
    datasetVersion: string | null;
    region: string | null;
    effectiveYear: number | null;
  }[];
  totalFactors: number;
};
