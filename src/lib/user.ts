import type { UserType } from '@vayura/api-contracts/common';

export type ConsultantRole = 'Partner' | 'Manager' | 'Consultant' | 'Analyst';
export type SmeRole = 'Owner' | 'Approver' | 'Contributor' | 'Viewer';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatar: string;
  userType: UserType;
  clientId?: string;
};

export function buildAppUser(input: {
  id: string;
  email: string;
  fullName: string | null;
  userType: UserType;
  company: string;
}): AppUser {
  const local = input.email.split('@')[0]?.replace(/\./g, ' ') ?? 'User';
  const derivedName = local
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    id: input.id,
    email: input.email,
    name: input.fullName?.trim() || derivedName,
    userType: input.userType,
    company: input.company,
    avatar: input.email.slice(0, 2).toUpperCase(),
  };
}
