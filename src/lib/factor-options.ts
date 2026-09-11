import type { ExtractedLineItemDto } from '@vayura/api-contracts/ingestion';
import type { EmissionFactor } from '@/lib/mock-data';

/** Merge library factors with pipeline-matched factors so Select values always resolve. */
export function mergeFactorOptions(
  library: EmissionFactor[],
  lineItems: ExtractedLineItemDto[],
): EmissionFactor[] {
  const byId = new Map(library.map((f) => [f.id, f]));

  for (const line of lineItems) {
    if (!line.factorId || byId.has(line.factorId)) continue;
    byId.set(line.factorId, {
      id: line.factorId,
      name: line.factorName || 'Matched factor',
      category: line.category,
      value: line.factorValue,
      unit: line.factorUnit || '—',
      source: line.factorSourceName || '—',
      lastUpdated: line.factorEffectiveYear ? String(line.factorEffectiveYear) : '—',
      scope: (line.scope as EmissionFactor['scope']) || 'Scope 3',
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}
