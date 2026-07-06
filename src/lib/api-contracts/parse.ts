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
  clientViewerEnabled: z.boolean(),
  showConsultantBranding: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const meProfileSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    userType: z.enum(['consultant', 'sme']),
    fullName: z.string().nullable(),
  }),
  tenant: z
    .object({
      id: z.string(),
      name: z.string(),
      plan: z.enum(['starter', 'growth', 'enterprise']),
      role: z.enum(['consultant_admin', 'consultant_member']),
    })
    .nullable(),
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
