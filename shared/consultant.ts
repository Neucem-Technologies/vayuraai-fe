import type { OrgRole } from './common.js';

export type ClientViewerSummary = {
  userId: string;
  email: string;
  fullName: string | null;
  role: OrgRole;
};

export type ClientViewersListResponse = { viewers: ClientViewerSummary[] };

export type InviteClientViewerResponse = {
  inviteToken: string;
  expiresAt: string;
};

export type RevokeClientViewerResponse = { revoked: boolean };
