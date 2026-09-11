import { z } from 'zod';
import type { MeProfile } from '@vayura/api-contracts/auth';

const accessPermissionsSchema = z.object({
  readOnly: z.boolean(),
  canManageClientPortal: z.boolean(),
  canManageTenant: z.boolean(),
  canAssignConsultants: z.boolean(),
});

const accessProfileSchema = z.object({
  kind: z.enum(['consultant', 'client_viewer']),
  tenantRole: z.enum(['consultant_admin', 'consultant_member']).nullable(),
  orgRole: z.enum(['client_viewer', 'client_contributor']).nullable(),
  orgId: z.string().nullable(),
  allowedOrgIds: z.array(z.string()),
  permissions: accessPermissionsSchema,
  canEnableClientPortal: z.boolean(),
});

const organisationSchema = z.object({
  id: z.string(),
  legalName: z.string(),
  shortName: z.string(),
  industry: z.string().nullable(),
  country: z.string(),
  status: z.enum(['active', 'onboarding', 'paused', 'archived']),
  consolidationApproach: z.enum(['operational', 'financial', 'equity']).default('operational'),
  clientViewerEnabled: z.boolean(),
  showConsultantBranding: z.boolean(),
  cin: z.string().nullable().optional().default(null),
  lei: z.string().nullable().optional().default(null),
  gstin: z.string().nullable().optional().default(null),
  yearOfIncorporation: z.number().int().nullable().optional().default(null),
  registeredOfficeAddress: z.string().optional().default(""),
  website: z.string().nullable().optional().default(null),
  email: z.string().nullable().optional().default(null),
  telephone: z.string().nullable().optional().default(null),
  stockExchanges: z.string().nullable().optional().default(null),
  paidUpCapitalInr: z.number().nullable().optional().default(null),
  employeeCount: z.number().int().nullable().optional().default(null),
  workerCount: z.number().int().nullable().optional().default(null),
  annualTurnoverInr: z.number().nullable().optional().default(null),
  contactName: z.string().nullable().optional().default(null),
  contactEmail: z.string().nullable().optional().default(null),
  contactPhone: z.string().nullable().optional().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const reportLogoPlacementSchema = z.enum([
  'header_left',
  'header_right',
  'header_center',
  'footer_left',
  'footer_right',
  'footer_center',
]);

const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  plan: z.enum(['starter', 'growth', 'enterprise']),
  role: z.enum(['consultant_admin', 'consultant_member']),
  whiteLabelEnabled: z.boolean().default(false),
  brandColorHex: z.string().default('#1F4D33'),
  reportFooterDisclaimer: z.string().default(''),
  reportLogoPlacement: reportLogoPlacementSchema.default('header_left'),
  hasReportLogo: z.boolean().default(false),
});

export const meProfileSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    userType: z.enum(['consultant', 'sme']),
    fullName: z.string().nullable(),
  }),
  tenant: tenantSchema.nullable(),
  organisations: z.array(organisationSchema),
  orgMemberships: z.array(
    z.object({
      orgId: z.string(),
      role: z.enum(['client_viewer', 'client_contributor']),
      organisation: organisationSchema,
    }),
  ),
  access: accessProfileSchema,
});

export function parseMeProfile(data: unknown): MeProfile {
  return meProfileSchema.parse(data);
}
