import { create } from 'zustand';
import { MOCK_SME_USER, MOCK_USER, type AppUser } from '@/lib/mock-data';
import * as authApi from '@/lib/auth-api';
import type { PublicUser, UserType } from '@/lib/auth-api';
import type { AccessProfile } from '@/lib/organisations-api';

export type { UserType } from '@/lib/auth-api';

const ACTIVE_CLIENT_KEY = 'vayura_active_client';
export type { AccessProfile };

/** Bearer token storage key (shared with backend session contract). */
export const TOKEN_KEY = 'vayura_access_token';
const USER_TYPE_KEY = 'vayura_user_type';

function mapApiUser(
  api: PublicUser & { fullName?: string | null },
  tenantName?: string,
  clientOrgName?: string,
): AppUser {
  const userType = api.userType ?? readStoredUserType();
  const base = userType === 'sme' ? MOCK_SME_USER : MOCK_USER;
  const local = api.email.split('@')[0]?.replace(/\./g, ' ') ?? 'User';
  const title = local
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    ...base,
    id: api.id,
    email: api.email,
    name: api.fullName?.trim() || title,
    userType,
    company: clientOrgName ?? tenantName ?? base.company,
    avatar: api.email.slice(0, 2).toUpperCase(),
    clientId: undefined,
  };
}

interface AuthState {
  user: AppUser | null;
  access: AccessProfile | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  hydrate: () => Promise<void>;
  establishSessionFromLogin: (accessToken: string, apiUser: PublicUser) => Promise<void>;
  establishSessionFromInvite: (accessToken: string, orgId: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

function readStoredUserType(): UserType {
  const v = localStorage.getItem(USER_TYPE_KEY);
  return v === 'sme' ? 'sme' : 'consultant';
}

function persistAuthSnapshot(
  user: AppUser,
  access: AccessProfile | null,
  isAuthenticated: boolean,
  onboardingComplete: boolean,
): void {
  localStorage.setItem(
    'vayura_auth',
    JSON.stringify({ user, access, isAuthenticated, onboardingComplete }),
  );
}

function applyProfile(
  profile: authApi.MeProfile,
  set: (partial: Partial<AuthState>) => void,
): void {
  const clientOrg = profile.access.kind === 'client_viewer' ? profile.organisations[0] : undefined;
  const user = mapApiUser(profile.user, profile.tenant?.name, clientOrg?.legalName);
  if (clientOrg) {
    user.clientId = clientOrg.id;
    localStorage.setItem(ACTIVE_CLIENT_KEY, clientOrg.id);
  }
  set({
    user,
    access: profile.access,
    isAuthenticated: true,
    onboardingComplete: profile.access.kind === 'client_viewer',
  });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  access: null,
  isAuthenticated: false,
  onboardingComplete: false,

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, access: null, isAuthenticated: false, onboardingComplete: false });
      return;
    }
    try {
      const profile = await authApi.fetchMe(token);
      if (profile.access.kind === 'consultant') {
        const { completed } = await authApi.fetchOnboardingStatus(token);
        applyProfile(profile, set);
        set({ onboardingComplete: completed });
        persistAuthSnapshot(
          useAuthStore.getState().user!,
          profile.access,
          true,
          completed,
        );
      } else {
        applyProfile(profile, set);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_TYPE_KEY);
      localStorage.removeItem('vayura_auth');
      set({ user: null, access: null, isAuthenticated: false, onboardingComplete: false });
    }
  },

  establishSessionFromLogin: async (accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    const profile = await authApi.fetchMe(accessToken);
    localStorage.setItem(USER_TYPE_KEY, profile.user.userType);
    if (profile.access.kind === 'consultant') {
      const { completed } = await authApi.fetchOnboardingStatus(accessToken);
      applyProfile(profile, set);
      set({ onboardingComplete: completed });
      persistAuthSnapshot(useAuthStore.getState().user!, profile.access, true, completed);
    } else {
      applyProfile(profile, set);
    }
  },

  establishSessionFromInvite: async (accessToken, orgId) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_TYPE_KEY, 'sme');
    const profile = await authApi.fetchMe(accessToken);
    applyProfile(profile, set);
    localStorage.setItem(ACTIVE_CLIENT_KEY, orgId);
    set({ onboardingComplete: true });
  },

  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await authApi.logout(token);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_TYPE_KEY);
      localStorage.removeItem('vayura_auth');
      localStorage.removeItem(ACTIVE_CLIENT_KEY);
      set({ user: null, access: null, isAuthenticated: false, onboardingComplete: false });
    }
  },

  completeOnboarding: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await authApi.completeOnboarding(token);
    set((s) => {
      const next = { ...s, onboardingComplete: true };
      if (s.user) persistAuthSnapshot(s.user, s.access, true, true);
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
