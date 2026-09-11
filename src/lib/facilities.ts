import type { FacilityPurpose } from '@vayura/api-contracts/common';

/** Matches backend default for SaaS / shared services. */
export const ORGANISATION_WIDE_FACILITY = 'Organisation-wide';

export const OPERATION_FACILITY_TYPES = [
  'Office',
  'Manufacturing',
  'Data Center',
  'Warehouse',
  'R&D',
] as const;

/** Sites that generate energy used to reduce residual / offset views — not a BRSR net-off. */
export const GENERATION_FACILITY_TYPES = [
  'Solar PV',
  'Wind',
  'Hydro',
  'Captive power plant',
  'Other generation',
] as const;

export const FACILITY_TYPES = [...OPERATION_FACILITY_TYPES, ...GENERATION_FACILITY_TYPES] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

const GENERATION_TYPE_SET = new Set<string>(GENERATION_FACILITY_TYPES);

export function typesForPurpose(purpose: FacilityPurpose): readonly string[] {
  return purpose === 'generation' ? GENERATION_FACILITY_TYPES : OPERATION_FACILITY_TYPES;
}

export function resolveFacilityPurpose(
  type: string,
  purpose?: FacilityPurpose | null,
): FacilityPurpose {
  if (purpose === 'generation' || purpose === 'operations') return purpose;
  return GENERATION_TYPE_SET.has(type) ? 'generation' : 'operations';
}

export function isGenerationFacility(purpose: FacilityPurpose | string | undefined): boolean {
  return purpose === 'generation';
}

export function displayFacility(facility: string | undefined | null, category?: string): string {
  const trimmed = facility?.trim();
  if (trimmed) return trimmed;
  if (category === 'Purchased Services') return ORGANISATION_WIDE_FACILITY;
  return '—';
}
