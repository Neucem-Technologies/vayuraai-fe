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
};

export type EmissionFactorsListResponse = {
  factors: EmissionFactorDto[];
  region: string;
  year: number;
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
