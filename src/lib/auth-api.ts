import { apiFetch } from '@/lib/api-client';
import { parseMeProfile } from '@/lib/api-contracts/parse';
import type {
  AcceptTeamInviteResponse,
  AuthLoginResponse,
  AuthRegisterResponse,
  ForgotPasswordResponse,
  MeProfile,
  OnboardingStatusResponse,
  ProvisionFirmInput,
  ProvisionFirmResponse,
  PublicUser,
  ResetPasswordResponse,
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

export async function fetchMe(): Promise<MeProfile> {
  const raw = await apiFetch<unknown>('/api/v1/auth/me', { method: 'GET' });
  return parseMeProfile(raw);
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatusResponse> {
  return apiFetch<OnboardingStatusResponse>('/api/v1/auth/onboarding/status', { method: 'GET' });
}

export async function completeOnboarding(): Promise<OnboardingStatusResponse> {
  return apiFetch<OnboardingStatusResponse>('/api/v1/auth/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function provisionFirm(input: ProvisionFirmInput): Promise<ProvisionFirmResponse> {
  return apiFetch<ProvisionFirmResponse>('/api/v1/auth/onboarding/firm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function acceptTeamInvite(token: string, password: string): Promise<AcceptTeamInviteResponse> {
  return apiFetch<AcceptTeamInviteResponse>('/api/v1/auth/accept-team-invite', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<{ loggedOut: boolean }>('/api/v1/auth/logout', { method: 'POST' });
}
