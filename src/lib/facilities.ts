/**
 * Facility / reporting-boundary helpers shared by Uploads, Review, Reports, and Org settings.
 *
 * Inventory (uploads + reports) uses **operations** sites only.
 * Generation / offset sites are managed under Org settings and are not upload targets.
 */
import type { FacilityPurpose } from '@vayura/api-contracts/common';

/** Matches backend default for SaaS / shared services. */
export const ORGANISATION_WIDE_FACILITY = 'Organisation-wide';

export type FacilityLike = {
  id: string;
  name: string;
  purpose?: FacilityPurpose | string | null;
  type?: string;
};

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

/** Sites that can receive activity data / report inventory boundaries. */
export function operationalFacilities<T extends FacilityLike>(facilities: T[]): T[] {
  return facilities.filter((f) => !isGenerationFacility(resolveFacilityPurpose(f.type ?? '', f.purpose)));
}

export function generationFacilities<T extends FacilityLike>(facilities: T[]): T[] {
  return facilities.filter((f) => isGenerationFacility(resolveFacilityPurpose(f.type ?? '', f.purpose)));
}

/** Normalize blank / unknown labels before save or display. */
export function normalizeFacilityLabel(
  facility: string | undefined | null,
  category?: string,
): string {
  const trimmed = facility?.trim();
  if (trimmed) return trimmed;
  if (category === 'Purchased Services') return ORGANISATION_WIDE_FACILITY;
  return ORGANISATION_WIDE_FACILITY;
}

export function displayFacility(facility: string | undefined | null, category?: string): string {
  const trimmed = facility?.trim();
  if (trimmed) return trimmed;
  if (category === 'Purchased Services') return ORGANISATION_WIDE_FACILITY;
  return '—';
}

export function boundaryLabelDisplay(boundaryLabel: string | undefined | null): string {
  const value = boundaryLabel?.trim() || 'all';
  switch (value) {
    case 'all':
      return 'All operations';
    case 'india':
      return 'India operations';
    case 'manufacturing':
      return 'Manufacturing only';
    case ORGANISATION_WIDE_FACILITY:
      return 'Organisation-wide (shared / SaaS)';
    default:
      return value;
  }
}

/** Build report boundary choices from operational sites only. */
export function reportBoundaryOptions(facilities: FacilityLike[]): Array<{ value: string; label: string }> {
  const opts = [
    { value: 'all', label: 'All operations sites' },
    { value: ORGANISATION_WIDE_FACILITY, label: 'Organisation-wide (shared / SaaS)' },
    { value: 'india', label: 'India operations only' },
  ];
  for (const f of operationalFacilities(facilities)) {
    if (f.name === ORGANISATION_WIDE_FACILITY) continue;
    opts.push({ value: f.name, label: f.name });
  }
  return opts;
}
