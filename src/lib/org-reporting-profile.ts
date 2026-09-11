import type { OrganisationReportingInput } from "@vayura/api-contracts/tenancy";
import { z } from "zod";

export const orgReportingFormSchema = z.object({
  cin: z.string(),
  lei: z.string(),
  gstin: z.string(),
  yearOfIncorporation: z.string(),
  registeredOfficeAddress: z.string(),
  website: z.string(),
  email: z.string(),
  telephone: z.string(),
  stockExchanges: z.string(),
  paidUpCapitalInr: z.string(),
  employeeCount: z.string(),
  workerCount: z.string(),
  annualTurnoverInr: z.string(),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
});

export const orgReportingFormDefaults: z.infer<typeof orgReportingFormSchema> = {
  cin: "",
  lei: "",
  gstin: "",
  yearOfIncorporation: "",
  registeredOfficeAddress: "",
  website: "",
  email: "",
  telephone: "",
  stockExchanges: "",
  paidUpCapitalInr: "",
  employeeCount: "",
  workerCount: "",
  annualTurnoverInr: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export type OrgReportingFormValues = z.infer<typeof orgReportingFormSchema>;

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInt(value: string | undefined): number | null {
  const trimmed = value?.replace(/,/g, "").trim() ?? "";
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function parseOptionalNumber(value: string | undefined): number | null {
  const trimmed = value?.replace(/,/g, "").trim() ?? "";
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function reportingFormToApi(values: OrgReportingFormValues): OrganisationReportingInput {
  return {
    cin: emptyToNull(values.cin),
    lei: emptyToNull(values.lei),
    gstin: emptyToNull(values.gstin),
    yearOfIncorporation: parseOptionalInt(values.yearOfIncorporation),
    registeredOfficeAddress: emptyToNull(values.registeredOfficeAddress),
    website: emptyToNull(values.website),
    email: emptyToNull(values.email),
    telephone: emptyToNull(values.telephone),
    stockExchanges: emptyToNull(values.stockExchanges),
    paidUpCapitalInr: parseOptionalNumber(values.paidUpCapitalInr),
    employeeCount: parseOptionalInt(values.employeeCount),
    workerCount: parseOptionalInt(values.workerCount),
    annualTurnoverInr: parseOptionalNumber(values.annualTurnoverInr),
    contactName: emptyToNull(values.contactName),
    contactEmail: emptyToNull(values.contactEmail),
    contactPhone: emptyToNull(values.contactPhone),
  };
}

export function numberToFormValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}
