import { create } from 'zustand';
import * as authApi from '@/lib/auth-api';
import { buildAppUser, type AppUser } from '@/lib/user';
import type { MeProfile } from '@vayura/api-contracts/auth';
import type { AccessProfile } from '@vayura/api-contracts/auth';
import type { TenantDto } from '@vayura/api-contracts/tenancy';
import type { UserType } from '@vayura/api-contracts/common';
import {
  getUserType,
  isClientViewer,
  isConsultantWorkspace,
} from '@vayura/api-contracts/profile';
import { useActiveClientStore, readStoredActiveClient } from '@/hooks/use-active-client-store';
import { clearAppQueryCache } from '@/lib/query-client';
import {
  ACTIVE_TENANT_STORAGE_KEY,
  clearWorkspaceSessionState,
} from '@/lib/session-reset';
import { ApiRequestError } from '@/lib/api-client';

export type { UserType, AccessProfile, MeProfile };

export const TOKEN_KEY = 'vayura_access_token';
const USER_TYPE_KEY = 'vayura_user_type';

function makeFallbackProfileFromLogin(user: { id: string; email: string; userType: UserType }): MeProfile {
  const kind = user.userType === 'sme' ? 'client_viewer' : 'consultant';
  return {
    user: {
      id: user.id,
      email: user.email,
      userType: user.userType,
      fullName: null,
    },
    tenant: null,
    organisations: [],
    orgMemberships: [],
    access: {
      kind,
      tenantRole: null,
      orgRole: null,
      orgId: null,
      allowedOrgIds: [],
      permissions: {
        readOnly: false,
        canManageClientPortal: false,
        canManageTenant: false,
        canAssignConsultants: false,
      },
      canEnableClientPortal: false,
    },
  };
}

function companyFromProfile(profile: MeProfile): string {
  const clientOrg = isClientViewer(profile) ? profile.organisations[0] : undefined;
  return clientOrg?.legalName ?? profile.tenant?.name ?? '—';
}

/**
 * Bind the active client to the current tenant's organisations only.
 * Never reuse an org id from a previous firm after logout/login.
 */
function syncActiveClientWithAccess(profile: MeProfile): void {
  const { setActiveClient } = useActiveClientStore.getState();
  const currentTenantId = profile.tenant?.id ?? null;
  const storedTenant = localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
  const tenantChanged = !!currentTenantId && storedTenant !== currentTenantId;

  if (currentTenantId) {
    localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, currentTenantId);
  } else {
    localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
  }

  if (isClientViewer(profile)) {
    const allowed = new Set(
      profile.access.allowedOrgIds.length > 0
        ? profile.access.allowedOrgIds
        : profile.organisations.map((o) => o.id),
    );
    const storedClient = readStoredActiveClient(currentTenantId);
    if (storedClient && allowed.has(storedClient)) {
      setActiveClient(storedClient);
      return;
    }
    const orgId = profile.access.orgId ?? profile.organisations[0]?.id ?? null;
    setActiveClient(orgId);
    return;
  }

  const orgIds = new Set(profile.organisations.map((o) => o.id));
  const storedClient = readStoredActiveClient(currentTenantId);
  // Prefer organisations list from /me (already tenant-scoped). Do not trust a stale
  // active-client id across tenant switches.
  if (!tenantChanged && storedClient && orgIds.has(storedClient)) {
    setActiveClient(storedClient);
    return;
  }

  const firstAccessibleOrgId =
    profile.organisations[0]?.id ?? profile.access.allowedOrgIds[0] ?? null;
  setActiveClient(firstAccessibleOrgId);
}

interface AuthState {
  user: AppUser | null;
  tenant: TenantDto | null;
  access: AccessProfile | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  authHydrated: boolean;
  hydrate: () => Promise<void>;
  refreshSession: () => Promise<void>;
  establishSessionFromLogin: (accessToken: string, fallbackProfile?: { id: string; email: string; userType: UserType }) => Promise<MeProfile>;
  establishSessionFromInvite: (accessToken: string, orgId: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

function clearAuthSession(set: (partial: Partial<AuthState>) => void): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  localStorage.removeItem('vayura_auth');
  clearWorkspaceSessionState();
  set({
    user: null,
    tenant: null,
    access: null,
    isAuthenticated: false,
    onboardingComplete: false,
  });
}

function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiRequestError && err.status === 401;
}

function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiRequestError && err.status === 404;
}

type LoginUserFallback = { id: string; email: string; userType: UserType };

function readStoredLoginFallback(): LoginUserFallback | undefined {
  try {
    const raw = localStorage.getItem('vayura_auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { user?: LoginUserFallback };
    const user = parsed.user;
    if (user?.id && user?.email && user?.userType) return user;
  } catch {
    return undefined;
  }
  return undefined;
}

async function resolveMeProfile(
  token: string,
  fallbackProfile?: LoginUserFallback,
): Promise<MeProfile> {
  try {
    return await authApi.fetchMe(token);
  } catch (err) {
    if (isNotFoundError(err) && fallbackProfile) {
      return makeFallbackProfileFromLogin(fallbackProfile);
    }
    throw err;
  }
}

async function resolveOnboardingComplete(token: string, profile: MeProfile): Promise<boolean> {
  if (!isConsultantWorkspace(profile)) {
    return isClientViewer(profile);
  }
  try {
    const { completed } = await authApi.fetchOnboardingStatus(token);
    return completed;
  } catch (err) {
    // Older / mis-routed APIs 404 this GET for new users. Treat as "not done"
    // so signup/login can continue into onboarding after a successful register.
    if (isNotFoundError(err)) return false;
    throw err;
  }
}

async function loadSessionFromToken(
  token: string,
  set: (partial: Partial<AuthState>) => void,
  fallbackProfile?: LoginUserFallback,
): Promise<MeProfile> {
  const profile = await resolveMeProfile(token, fallbackProfile);
  const completed = await resolveOnboardingComplete(token, profile);
  applyProfile(profile, set);
  set({ onboardingComplete: completed });
  persistAuthSnapshot(
    useAuthStore.getState().user!,
    profile.tenant,
    profile.access,
    true,
    completed,
  );
  return profile;
}

function persistAuthSnapshot(
  user: AppUser,
  tenant: TenantDto | null,
  access: AccessProfile,
  isAuthenticated: boolean,
  onboardingComplete: boolean,
): void {
  localStorage.setItem(
    'vayura_auth',
    JSON.stringify({ user, tenant, access, isAuthenticated, onboardingComplete }),
  );
}

function applyProfile(profile: MeProfile, set: (partial: Partial<AuthState>) => void): AppUser {
  const user = buildAppUser({
    id: profile.user.id,
    email: profile.user.email,
    fullName: profile.user.fullName,
    userType: getUserType(profile),
    company: companyFromProfile(profile),
  });

  if (isClientViewer(profile) && profile.organisations[0]) {
    user.clientId = profile.organisations[0].id;
  }

  syncActiveClientWithAccess(profile);

  set({
    user,
    tenant: profile.tenant,
    access: profile.access,
    isAuthenticated: true,
    onboardingComplete: isClientViewer(profile),
  });
  return user;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  access: null,
  isAuthenticated: false,
  onboardingComplete: false,
  authHydrated: false,

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({
        user: null,
        tenant: null,
        access: null,
        isAuthenticated: false,
        onboardingComplete: false,
        authHydrated: true,
      });
      return;
    }
    try {
      await loadSessionFromToken(token, set, readStoredLoginFallback());
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearAuthSession(set);
      }
    } finally {
      set({ authHydrated: true });
    }
  },

  refreshSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await loadSessionFromToken(token, set, readStoredLoginFallback());
  },

  establishSessionFromLogin: async (accessToken, fallbackProfile) => {
    clearWorkspaceSessionState();
    clearAppQueryCache();
    localStorage.setItem(TOKEN_KEY, accessToken);
    const profile = await loadSessionFromToken(accessToken, set, fallbackProfile);
    localStorage.setItem(USER_TYPE_KEY, getUserType(profile));
    syncActiveClientWithAccess(profile);
    clearAppQueryCache();
    return profile;
  },

  establishSessionFromInvite: async (accessToken, orgId) => {
    clearWorkspaceSessionState();
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_TYPE_KEY, 'sme');
    const profile = await authApi.fetchMe(accessToken);
    applyProfile(profile, set);
    useActiveClientStore.getState().setActiveClient(orgId);
    if (profile.tenant?.id) {
      localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, profile.tenant.id);
    }
    set({ onboardingComplete: true });
    clearAppQueryCache();
  },

  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await authApi.logout(token);
    } finally {
      clearAuthSession(set);
      set({ authHydrated: true });
    }
  },

  completeOnboarding: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await authApi.completeOnboarding(token);
    set((s) => {
      const next = { ...s, onboardingComplete: true };
      if (s.user && s.access) {
        persistAuthSnapshot(s.user, s.tenant, s.access, true, true);
      }
      return next;
    });
  },
}));

export function useIsClientViewer(): boolean {
  return useAuthStore((s) => s.access?.kind === 'client_viewer');
}

export function useIsConsultantAdmin(): boolean {
  return useAuthStore((s) => s.access?.permissions.canManageClientPortal ?? false);
}

export function useTenant(): TenantDto | null {
  return useAuthStore((s) => s.tenant);
}
