import { getJson, postJson } from '../../../shared/api/http';
import type { AppUser, CreateUserInput } from '../types';

export function getUsers(accessToken: string) {
  return getJson<AppUser[]>('/api/users', { accessToken });
}

export function getUser(id: string, accessToken: string) {
  return getJson<AppUser>(`/api/users/${id}`, { accessToken });
}

export function createUser(input: CreateUserInput, accessToken: string) {
  return postJson<AppUser>('/api/users', input, { accessToken });
}

export function approveUser(id: string, accessToken: string) {
  return postJson<AppUser>(`/api/users/${id}/approve`, undefined, { accessToken });
}

export function disableUser(id: string, accessToken: string) {
  return postJson<AppUser>(`/api/users/${id}/disable`, undefined, { accessToken });
}

export function enableUser(id: string, accessToken: string) {
  return postJson<AppUser>(`/api/users/${id}/enable`, undefined, { accessToken });
}
