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
import { useActiveClientStore } from '@/hooks/use-active-client-store';
import { clearAppQueryCache } from '@/lib/query-client';

export type { UserType, AccessProfile, MeProfile };

const ACTIVE_CLIENT_KEY = 'vayura_active_client';
export const TOKEN_KEY = 'vayura_access_token';
const USER_TYPE_KEY = 'vayura_user_type';

function companyFromProfile(profile: MeProfile): string {
  const clientOrg = isClientViewer(profile) ? profile.organisations[0] : undefined;
  return clientOrg?.legalName ?? profile.tenant?.name ?? '—';
}

function syncActiveClientWithAccess(profile: MeProfile): void {
  const { setActiveClient } = useActiveClientStore.getState();
  const stored = localStorage.getItem(ACTIVE_CLIENT_KEY);
  const allowed = new Set(profile.access.allowedOrgIds);

  if (isClientViewer(profile)) {
    const orgId = profile.access.orgId ?? profile.organisations[0]?.id ?? null;
    setActiveClient(orgId);
    return;
  }

  if (stored && (profile.organisations.some((o) => o.id === stored) || allowed.has(stored))) {
    setActiveClient(stored);
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
  establishSessionFromLogin: (accessToken: string) => Promise<MeProfile>;
  establishSessionFromInvite: (accessToken: string, orgId: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

function clearAuthSession(set: (partial: Partial<AuthState>) => void): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  localStorage.removeItem('vayura_auth');
  localStorage.removeItem(ACTIVE_CLIENT_KEY);
  useActiveClientStore.getState().setActiveClient(null);
  clearAppQueryCache();
  set({
    user: null,
    tenant: null,
    access: null,
    isAuthenticated: false,
    onboardingComplete: false,
  });
}

function isUnauthorizedError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status: number }).status === 401
  );
}

async function loadSessionFromToken(
  token: string,
  set: (partial: Partial<AuthState>) => void,
): Promise<void> {
  const profile = await authApi.fetchMe(token);
  if (isConsultantWorkspace(profile)) {
    const { completed } = await authApi.fetchOnboardingStatus(token);
    applyProfile(profile, set);
    set({ onboardingComplete: completed });
    persistAuthSnapshot(
      useAuthStore.getState().user!,
      profile.tenant,
      profile.access,
      true,
      completed,
    );
  } else {
    applyProfile(profile, set);
    persistAuthSnapshot(
      useAuthStore.getState().user!,
      profile.tenant,
      profile.access,
      true,
      useAuthStore.getState().onboardingComplete,
    );
  }
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
      await loadSessionFromToken(token, set);
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
    await loadSessionFromToken(token, set);
  },

  establishSessionFromLogin: async (accessToken) => {
    clearAppQueryCache();
    localStorage.setItem(TOKEN_KEY, accessToken);
    const profile = await authApi.fetchMe(accessToken);
    localStorage.setItem(USER_TYPE_KEY, getUserType(profile));
    await loadSessionFromToken(accessToken, set);
    return profile;
  },

  establishSessionFromInvite: async (accessToken, orgId) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_TYPE_KEY, 'sme');
    const profile = await authApi.fetchMe(accessToken);
    applyProfile(profile, set);
    useActiveClientStore.getState().setActiveClient(orgId);
    set({ onboardingComplete: true });
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
