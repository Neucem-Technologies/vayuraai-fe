import * as XLSX from 'xlsx';
import type { CreateCustomEmissionFactorInput } from '@vayura/api-contracts/emission-factors';

const SCOPE_MAP: Record<string, CreateCustomEmissionFactorInput['scope']> = {
  '1': 'Scope 1',
  'scope 1': 'Scope 1',
  scope1: 'Scope 1',
  '2': 'Scope 2',
  'scope 2': 'Scope 2',
  scope2: 'Scope 2',
  '3': 'Scope 3',
  'scope 3': 'Scope 3',
  scope3: 'Scope 3',
};

function normalizeHeader(h: string): string {
  return String(h).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function normalizeScope(raw: unknown): CreateCustomEmissionFactorInput['scope'] | null {
  if (raw === undefined || raw === null || raw === '') return null;
  return SCOPE_MAP[String(raw).trim().toLowerCase()] ?? null;
}

function cell(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

function rowToFactor(row: Record<string, unknown>): CreateCustomEmissionFactorInput | null {
  const name = cell(row, ['name', 'factor', 'factor_name', 'description', 'activity']);
  const category = cell(row, ['category', 'cat', 'activity_category']) ?? 'Other';
  const scope = normalizeScope(cell(row, ['scope', 'ghg_scope', 'ghg']));
  const valueRaw = cell(row, [
    'value',
    'factor_value',
    'emission_factor',
    'kgco2e',
    'kg_co2e',
    'ef',
  ]);
  const activityUnit = cell(row, ['activity_unit', 'activityunit', 'unit', 'uom']) ?? 'unit';
  const region = cell(row, ['region', 'country']) ?? 'India';
  const yearRaw = cell(row, ['effective_year', 'effectiveyear', 'year']);
  const validFrom = cell(row, ['valid_from', 'validfrom', 'from']);
  const validTo = cell(row, ['valid_to', 'validto', 'to']);

  const value = valueRaw ? Number(String(valueRaw).replace(/,/g, '')) : NaN;
  if (!name || name.length < 2 || !scope || !Number.isFinite(value) || value <= 0) return null;

  const effectiveYear = yearRaw ? Number.parseInt(yearRaw, 10) : undefined;
  return {
    name,
    category,
    scope,
    value,
    activityUnit,
    region,
    effectiveYear: Number.isFinite(effectiveYear) ? effectiveYear : undefined,
    validFrom: validFrom || null,
    validTo: validTo || null,
  };
}

/** Parse CSV / Excel worksheets into custom factor payloads. */
export function parseSpreadsheetFactors(file: ArrayBuffer): CreateCustomEmissionFactorInput[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const factors: CreateCustomEmissionFactorInput[] = [];
  for (const raw of rawRows) {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeHeader(k)] = v;
    }
    const factor = rowToFactor(normalized);
    if (factor) factors.push(factor);
  }
  return factors;
}

export function isSpreadsheetFactorFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.tsv');
}

export function isPdfFactorFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf');
}
