import { apiBaseUrl } from '../../auth/config/authConfig';
import type { SearchDocumentsResponse, SearchFilters } from '../types';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export async function searchDocuments(accessToken: string, filters: SearchFilters): Promise<SearchDocumentsResponse> {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.owner) params.set('owner', filters.owner);
  if (filters.controller) params.set('controller', filters.controller);
  if (filters.signer) params.set('signer', filters.signer);
  if (filters.archived) params.set('archived', filters.archived);
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));

  const response = await fetch(`${apiBaseUrl}/api/search/documents?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Search failed with status ${response.status}.`);
  }

  const payload = await response.json() as ApiEnvelope<SearchDocumentsResponse>;
  return payload.data;
}
