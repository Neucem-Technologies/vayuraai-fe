import type { AccessKind, AccessPermissions, OrgRole, TenantRole, UserType } from './common.js';
import type { OrganisationDto, OrgMembershipDto, TenantDto } from './tenancy.js';

export type PublicUser = {
  id: string;
  email: string;
  userType: UserType;
};

export type AuthLoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type AuthRegisterResponse = {
  user: PublicUser;
};

export type AccessProfile = {
  kind: AccessKind;
  tenantRole: TenantRole | null;
  orgRole: OrgRole | null;
  orgId: string | null;
  allowedOrgIds: string[];
  permissions: AccessPermissions;
  canEnableClientPortal: boolean;
};

/** GET /api/v1/auth/me */
export type MeProfile = {
  user: {
    id: string;
    email: string;
    userType: UserType;
    fullName: string | null;
  };
  tenant: TenantDto | null;
  organisations: OrganisationDto[];
  orgMemberships: OrgMembershipDto[];
  access: AccessProfile;
};

export type OnboardingStatusResponse = { completed: boolean };
export type LogoutResponse = { loggedOut: boolean };

export type AcceptClientInviteResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  orgId: string;
};
