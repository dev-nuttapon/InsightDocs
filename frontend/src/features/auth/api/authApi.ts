import { getJson, postJson } from '../../../shared/api/http';
import type { CurrentUser } from '../context/authTypes';

type ProtectedResponse = {
  message: string;
  utcTimestamp: string;
  username: string | null;
};

export type PasswordResetRequest = {
  id: string;
  userId: string;
  username: string;
  email: string;
  displayName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestedByIdentifier: string;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  resetTokenExpiresAt: string | null;
  resetUrl: string | null;
  completedAt: string | null;
};

export type RegisterUserInput = {
  username: string;
  email: string;
  displayName: string;
  password: string;
};

async function apiFetch<T>(path: string, accessToken?: string | null): Promise<T> {
  return getJson<T>(path, { accessToken });
}

export function getCurrentUser(accessToken?: string | null) {
  return apiFetch<CurrentUser>('/api/auth/me', accessToken);
}

export function getProtectedMessage(accessToken?: string | null) {
  return apiFetch<ProtectedResponse>('/api/auth/protected', accessToken);
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  return postJson<T>(path, body);
}

export function registerUser(input: RegisterUserInput) {
  return publicPost('/api/auth/register', input);
}

export function createForgotPasswordRequest(usernameOrEmail: string) {
  return publicPost('/api/auth/forgot-password', { usernameOrEmail });
}

export function resetPassword(token: string, newPassword: string) {
  return publicPost<void>('/api/auth/reset-password', { token, newPassword });
}

export async function getPasswordResetRequests(accessToken: string) {
  return apiFetch<PasswordResetRequest[]>('/api/admin/password-reset-requests', accessToken);
}

export async function approvePasswordResetRequest(id: string, comment: string, accessToken: string) {
  return publicAuthorizedPost<PasswordResetRequest>(`/api/admin/password-reset-requests/${id}/approve`, { comment }, accessToken);
}

export async function rejectPasswordResetRequest(id: string, comment: string, accessToken: string) {
  return publicAuthorizedPost<PasswordResetRequest>(`/api/admin/password-reset-requests/${id}/reject`, { comment }, accessToken);
}

async function publicAuthorizedPost<T>(path: string, body: unknown, accessToken: string) {
  return postJson<T>(path, body, { accessToken });
}
