import type { MeProfile } from './auth.js';
import type { AccessKind, UserType } from './common.js';
import { isUnpaidSubscriptionStatus } from './billing.js';

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

export function isVerifier(profile: MeProfile): boolean {
  return profile.access.kind === 'verifier';
}

export function needsBilling(profile: MeProfile): boolean {
  if (isClientViewer(profile) || isVerifier(profile)) return false;
  if (!profile.tenant) return false;
  return isUnpaidSubscriptionStatus(profile.tenant.subscriptionStatus);
}

export function resolvePostLoginPath(
  profile: MeProfile,
  onboardingComplete: boolean,
): '/client/dashboard' | '/verifier' | '/dashboard' | '/clients' | '/onboarding/organization' | '/billing' {
  if (isVerifier(profile)) {
    return '/verifier';
  }
  if (isClientViewer(profile)) {
    return '/client/dashboard';
  }
  // Workspace must exist before checkout (created in organisation onboarding).
  if (!profile.tenant) {
    return '/onboarding/organization';
  }
  if (needsBilling(profile)) {
    return '/billing';
  }
  if (!onboardingComplete) {
    // Organisation step already created the tenant; continue the rest of setup.
    return getUserType(profile) === 'sme' ? '/onboarding/data-sources' : '/onboarding/industry';
  }
  if (getUserType(profile) === 'sme') {
    return '/dashboard';
  }
  return '/clients';
}
