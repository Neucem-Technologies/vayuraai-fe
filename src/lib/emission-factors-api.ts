import { apiFetch } from '@/lib/api-client';
import { TOKEN_KEY } from '@/hooks/use-auth';
import type {
  BulkImportEmissionFactorsResponse,
  CreateCustomEmissionFactorInput,
  EmissionFactorDto,
  EmissionFactorResponse,
  EmissionFactorSyncResponse,
  EmissionFactorsListResponse,
  ParseEmissionFactorsFileResponse,
} from '@vayura/api-contracts/emission-factors';
import type { EmissionFactor } from '@/lib/mock-data';

export type { EmissionFactorDto, CreateCustomEmissionFactorInput };

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function emissionFactorDtoToUi(dto: EmissionFactorDto): EmissionFactor {
  const validLabel =
    dto.validFrom || dto.validTo
      ? `${dto.validFrom?.slice(0, 10) ?? '…'} → ${dto.validTo?.slice(0, 10) ?? '…'}`
      : `${dto.effectiveYear}`;
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    value: dto.value,
    unit: dto.factorUnit,
    source: dto.sourceName,
    lastUpdated: validLabel,
    scope: dto.scope as EmissionFactor['scope'],
  };
}

export async function listEmissionFactors(
  region = 'India',
  year = new Date().getFullYear(),
): Promise<EmissionFactor[]> {
  const params = new URLSearchParams({ region, year: String(year) });
  const data = await apiFetch<EmissionFactorsListResponse>(
    `/api/v1/emission-factors?${params}`,
    { accessToken: token() },
  );
  return data.factors.map(emissionFactorDtoToUi);
}

export async function createCustomEmissionFactor(
  input: CreateCustomEmissionFactorInput,
): Promise<EmissionFactor> {
  const data = await apiFetch<EmissionFactorResponse>('/api/v1/emission-factors', {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken: token(),
  });
  return emissionFactorDtoToUi(data.factor);
}

export async function syncEmissionFactors(): Promise<EmissionFactorSyncResponse> {
  return apiFetch<EmissionFactorSyncResponse>('/api/v1/emission-factors/sync', {
    method: 'POST',
    body: JSON.stringify({}),
    accessToken: token(),
  });
}

export async function parseEmissionFactorsFile(
  file: File,
): Promise<ParseEmissionFactorsFileResponse> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ParseEmissionFactorsFileResponse>('/api/v1/emission-factors/parse-file', {
    method: 'POST',
    body: form,
    accessToken: token(),
  });
}

export async function importCustomEmissionFactors(
  factors: CreateCustomEmissionFactorInput[],
): Promise<BulkImportEmissionFactorsResponse> {
  return apiFetch<BulkImportEmissionFactorsResponse>('/api/v1/emission-factors/import', {
    method: 'POST',
    body: JSON.stringify({ factors }),
    accessToken: token(),
  });
}
