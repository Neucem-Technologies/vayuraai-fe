import { create } from 'zustand';
import { MOCK_SME_USER, MOCK_USER, type AppUser } from '@/lib/mock-data';
import * as authApi from '@/lib/auth-api';
import type { PublicUser, UserType } from '@/lib/auth-api';

export type { UserType } from '@/lib/auth-api';

/** Bearer token storage key (shared with backend session contract). */
export const TOKEN_KEY = 'vayura_access_token';
const USER_TYPE_KEY = 'vayura_user_type';

function mapApiUser(
  api: PublicUser & { fullName?: string | null },
  tenantName?: string,
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
    company: tenantName ?? base.company,
    avatar: api.email.slice(0, 2).toUpperCase(),
  };
}

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  /** Restore session from stored bearer token (calls API). */
  hydrate: () => Promise<void>;
  /** After successful email/password login or signup (API user includes `userType`). */
  establishSessionFromLogin: (accessToken: string, apiUser: PublicUser) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

function readStoredUserType(): UserType {
  const v = localStorage.getItem(USER_TYPE_KEY);
  return v === 'sme' ? 'sme' : 'consultant';
}

function persistAuthSnapshot(user: AppUser, isAuthenticated: boolean, onboardingComplete: boolean): void {
  localStorage.setItem(
    'vayura_auth',
    JSON.stringify({
      user,
      isAuthenticated,
      onboardingComplete,
    }),
  );
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  onboardingComplete: false,

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, isAuthenticated: false, onboardingComplete: false });
      return;
    }
    try {
      const profile = await authApi.fetchMe(token);
      const { completed } = await authApi.fetchOnboardingStatus(token);
      const user = mapApiUser(profile.user, profile.tenant?.name);
      set({ user, isAuthenticated: true, onboardingComplete: completed });
      persistAuthSnapshot(user, true, completed);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_TYPE_KEY);
      localStorage.removeItem('vayura_auth');
      set({ user: null, isAuthenticated: false, onboardingComplete: false });
    }
  },

  establishSessionFromLogin: async (accessToken, apiUser) => {
    const userType = apiUser.userType ?? readStoredUserType();
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_TYPE_KEY, userType);
    const { completed } = await authApi.fetchOnboardingStatus(accessToken);
    const user = mapApiUser({ ...apiUser, userType });
    set({ user, isAuthenticated: true, onboardingComplete: completed });
    persistAuthSnapshot(user, true, completed);
  },

  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await authApi.logout(token);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_TYPE_KEY);
      localStorage.removeItem('vayura_auth');
      set({ user: null, isAuthenticated: false, onboardingComplete: false });
    }
  },

  completeOnboarding: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await authApi.completeOnboarding(token);
    set((s) => {
      const next = { ...s, onboardingComplete: true };
      if (s.user) persistAuthSnapshot(s.user, true, true);
      return next;
    });
  },
}));
