import type { MeProfile } from './auth.js';
import type { AccessKind, UserType } from './common.js';

/** Workspace access mode — use for permissions and routing. */
export function getAccessKind(profile: MeProfile): AccessKind {
  return profile.access.kind;
}

/** Signup account type — use for UI labels, not permissions. */
export function getUserType(profile: MeProfile): UserType {
  return profile.user.userType;
}

export function isClientViewer(profile: MeProfile): boolean {
  return profile.access.kind === 'client_viewer';
}

export function isConsultantWorkspace(profile: MeProfile): boolean {
  return profile.access.kind === 'consultant';
}

export function resolvePostLoginPath(
  profile: MeProfile,
  onboardingComplete: boolean,
): '/client/dashboard' | '/dashboard' | '/clients' | '/onboarding/organization' {
  if (isClientViewer(profile)) {
    return '/client/dashboard';
  }
  if (getUserType(profile) === 'sme') {
    return onboardingComplete ? '/dashboard' : '/onboarding/organization';
  }
  return onboardingComplete ? '/clients' : '/onboarding/organization';
}
