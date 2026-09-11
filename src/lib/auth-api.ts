import { apiFetch } from '@/lib/api-client';
import { parseMeProfile } from '@/lib/api-contracts/parse';
import type {
  AuthLoginResponse,
  AuthRegisterResponse,
  MeProfile,
  OnboardingStatusResponse,
  ProvisionFirmInput,
  ProvisionFirmResponse,
  PublicUser,
} from '@vayura/api-contracts/auth';
import type { UserType } from '@vayura/api-contracts/common';

export type { MeProfile, PublicUser, UserType, AuthLoginResponse, ProvisionFirmInput };

export async function register(
  email: string,
  password: string,
  userType: UserType = 'consultant',
): Promise<AuthRegisterResponse> {
  return apiFetch<AuthRegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, userType }),
  });
}

export async function login(email: string, password: string): Promise<AuthLoginResponse> {
  return apiFetch<AuthLoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(accessToken: string): Promise<MeProfile> {
  const raw = await apiFetch<unknown>('/api/v1/auth/me', {
    method: 'GET',
    accessToken,
  });
  return parseMeProfile(raw);
}

export async function fetchOnboardingStatus(accessToken: string): Promise<OnboardingStatusResponse> {
  return apiFetch<OnboardingStatusResponse>('/api/v1/auth/onboarding/status', {
    method: 'GET',
    accessToken,
  });
}

export async function completeOnboarding(accessToken: string): Promise<OnboardingStatusResponse> {
  return apiFetch<OnboardingStatusResponse>('/api/v1/auth/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({}),
    accessToken,
  });
}

export async function provisionFirm(
  accessToken: string,
  input: ProvisionFirmInput,
): Promise<ProvisionFirmResponse> {
  return apiFetch<ProvisionFirmResponse>('/api/v1/auth/onboarding/firm', {
    method: 'POST',
    body: JSON.stringify(input),
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
