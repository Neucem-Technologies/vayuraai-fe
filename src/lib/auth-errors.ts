import { ApiRequestError } from '@/lib/api-client';

export type AuthErrorContext = 'signup' | 'login';

export type AuthErrorPresentation = {
  title: string;
  description: string;
  /** Set on signup when email is already registered. */
  emailFieldMessage?: string;
};

const MESSAGES: Record<string, Omit<AuthErrorPresentation, 'emailFieldMessage'> & { emailFieldMessage?: string }> = {
  EMAIL_IN_USE: {
    title: 'Email already registered',
    description:
      'An account with this email already exists. Sign in instead, or register with a different email address.',
    emailFieldMessage: 'This email is already registered.',
  },
  INVALID_CREDENTIALS: {
    title: 'Could not sign in',
    description: 'Incorrect email or password. Check your details and try again.',
  },
  VALIDATION_ERROR: {
    title: 'Check your details',
    description: 'Some fields need attention before you can continue.',
  },
  BAD_REQUEST: {
    title: 'Check your details',
    description: 'Some fields need attention before you can continue.',
  },
  UNAUTHORIZED: {
    title: 'Session expired',
    description: 'Please sign in again to continue.',
  },
  NOT_FOUND: {
    title: 'Account not found',
    description: 'We could not find that account. Try signing in or creating a new account.',
  },
  INTERNAL_SERVER_ERROR: {
    title: 'Something went wrong',
    description: 'We could not complete your request. Please try again in a moment.',
  },
  NETWORK_ERROR: {
    title: 'Connection problem',
    description: 'Could not reach the server. Check your connection and try again.',
  },
  INVALID_RESPONSE: {
    title: 'Something went wrong',
    description: 'The server returned an unexpected response. Please try again.',
  },
};

/**
 * Maps API and network errors to user-facing toast copy (production-style).
 * Prefers server `message` when present; falls back to known codes.
 */
export function getAuthErrorPresentation(
  error: unknown,
  context: AuthErrorContext,
): AuthErrorPresentation {
  if (error instanceof ApiRequestError) {
    const known = MESSAGES[error.code];
    if (known) {
      return {
        title: known.title,
        description: error.message || known.description,
        emailFieldMessage: known.emailFieldMessage,
      };
    }
    if (error.status >= 500) {
      return {
        title: MESSAGES.INTERNAL_SERVER_ERROR.title,
        description: error.message || MESSAGES.INTERNAL_SERVER_ERROR.description,
      };
    }
    return {
      title: context === 'signup' ? 'Could not create account' : 'Could not sign in',
      description: error.message,
    };
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return MESSAGES.NETWORK_ERROR;
  }

  if (error instanceof Error) {
    if (error.message.includes('VITE_API_BASE_URL')) {
      return {
        title: 'App not configured',
        description: 'API URL is missing. Contact your administrator.',
      };
    }
    return {
      title: context === 'signup' ? 'Could not create account' : 'Could not sign in',
      description: error.message,
    };
  }

  return context === 'signup'
    ? {
        title: 'Could not create account',
        description: 'Something unexpected happened. Please try again.',
      }
    : {
        title: 'Could not sign in',
        description: 'Something unexpected happened. Please try again.',
      };
}
