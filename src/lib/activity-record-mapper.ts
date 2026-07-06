import type { ActivityRecordDto } from '@vayura/api-contracts/ingestion';
import type { EmissionRecord, Scope } from '@/lib/mock-data';
import { displayFacility } from '@/lib/facilities';

export function activityRecordToEmission(row: ActivityRecordDto): EmissionRecord {
  return {
    id: row.id,
    date: row.activityDate || row.approvedAt.slice(0, 10),
    facility: displayFacility(row.facility, row.category),
    scope: row.scope as Scope,
    category: row.category,
    activity: row.description,
    quantity: row.quantity,
    unit: row.unit,
    emissionFactor: row.factorValue,
    factorName: row.factorName,
    kgCO2e: row.kgCO2e,
    sourceDoc: row.sourceFilename,
    status: 'Approved',
    approvedBy: row.approvedByUserId,
    approvedAt: row.approvedAt,
  };
}
