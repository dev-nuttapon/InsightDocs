import { apiBaseUrl, authRequestTimeoutMs } from '../config/authConfig';
import type { CurrentUser } from '../context/authTypes';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

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

async function apiFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await requestWithTimeout(`${apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Your session is not authorized. Please sign in again.');
  }

  if (response.status === 403) {
    throw new Error('You are authenticated but do not have permission for this action.');
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function getCurrentUser(accessToken: string) {
  return apiFetch<CurrentUser>('/api/auth/me', accessToken);
}

export function getProtectedMessage(accessToken: string) {
  return apiFetch<ProtectedResponse>('/api/auth/protected', accessToken);
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const response = await requestWithTimeout(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
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
  const response = await requestWithTimeout(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

async function requestWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), authRequestTimeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.floor(authRequestTimeoutMs / 1000)} seconds.`);
    }

    throw new Error('Unable to reach the API. Check that InsightDocs backend is running and VITE_API_BASE_URL is correct.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}
