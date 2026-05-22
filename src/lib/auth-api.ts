import { apiFetch } from '@/lib/api-client';
import type { MeProfile } from '@/lib/organisations-api';

export type UserType = 'consultant' | 'sme';
export type { MeProfile };

export type PublicUser = {
  id: string;
  email: string;
  /** Present on current API; absent only against older backends. */
  userType?: UserType;
};

export type LoginResult = {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
};

export async function register(
  email: string,
  password: string,
  userType: UserType = 'consultant',
): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, userType }),
  });
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(accessToken: string): Promise<MeProfile> {
  return apiFetch<MeProfile>('/api/v1/auth/me', {
    method: 'GET',
    accessToken,
  });
}

export async function fetchOnboardingStatus(accessToken: string): Promise<{ completed: boolean }> {
  return apiFetch<{ completed: boolean }>('/api/v1/auth/onboarding/status', {
    method: 'GET',
    accessToken,
  });
}

export async function completeOnboarding(accessToken: string): Promise<{ completed: boolean }> {
  return apiFetch<{ completed: boolean }>('/api/v1/auth/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({}),
    accessToken,
  });
}

export async function logout(accessToken: string | null): Promise<void> {
  if (!accessToken) return;
  await apiFetch<{ loggedOut: boolean }>('/api/v1/auth/logout', {
    method: 'POST',
    accessToken,
  });
}
