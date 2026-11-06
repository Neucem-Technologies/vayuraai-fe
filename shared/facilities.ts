import type { FacilityPurpose } from './common.js';

/** Default label for SaaS / shared services not tied to a physical site. */
export const ORGANISATION_WIDE_FACILITY = 'Organisation-wide';

export const OPERATION_FACILITY_TYPES = [
  'Office',
  'Manufacturing',
  'Data Center',
  'Warehouse',
  'R&D',
] as const;

/** Generation / offset sites — not used as inventory upload targets. */
export const GENERATION_FACILITY_TYPES = [
  'Solar PV',
  'Wind',
  'Hydro',
  'Captive power plant',
  'Other generation',
] as const;

export const FACILITY_TYPES = [...OPERATION_FACILITY_TYPES, ...GENERATION_FACILITY_TYPES] as const;

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

export function isGenerationFacilityPurpose(
  purpose: FacilityPurpose | string | null | undefined,
): boolean {
  return purpose === 'generation';
}
