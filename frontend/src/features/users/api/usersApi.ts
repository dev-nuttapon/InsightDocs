import { apiBaseUrl } from '../../auth/config/authConfig';
import type { AppUser, CreateUserInput, UpdateUserInput } from '../types';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (response.status === 403) {
    throw new Error('Admin access is required.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function getUsers(accessToken: string) {
  return request<AppUser[]>('/api/users', accessToken);
}

export function getUser(id: string, accessToken: string) {
  return request<AppUser>(`/api/users/${id}`, accessToken);
}

export function createUser(input: CreateUserInput, accessToken: string) {
  return request<AppUser>('/api/users', accessToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UpdateUserInput, accessToken: string) {
  return request<AppUser>(`/api/users/${id}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function assignRole(id: string, roleName: string, accessToken: string) {
  return request<AppUser>(`/api/users/${id}/roles`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ roleName }),
  });
}

export function removeRole(id: string, roleName: string, accessToken: string) {
  return request<void>(`/api/users/${id}/roles/${encodeURIComponent(roleName)}`, accessToken, {
    method: 'DELETE',
  });
}

export function approveUser(id: string, accessToken: string) {
  return request<AppUser>(`/api/users/${id}/approve`, accessToken, { method: 'POST' });
}

export function disableUser(id: string, accessToken: string) {
  return request<AppUser>(`/api/users/${id}/disable`, accessToken, { method: 'POST' });
}

export function enableUser(id: string, accessToken: string) {
  return request<AppUser>(`/api/users/${id}/enable`, accessToken, { method: 'POST' });
}
