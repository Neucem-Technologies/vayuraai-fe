import { apiFetch } from '@/lib/api-client';
import { TOKEN_KEY } from '@/hooks/use-auth';
import type {
  EmissionFactorDto,
  EmissionFactorsListResponse,
} from '@vayura/api-contracts/emission-factors';
import type { EmissionFactor } from '@/lib/mock-data';

export type { EmissionFactorDto };

function token(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function emissionFactorDtoToUi(dto: EmissionFactorDto): EmissionFactor {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    value: dto.value,
    unit: dto.factorUnit,
    source: dto.sourceName,
    lastUpdated: `${dto.effectiveYear}`,
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
