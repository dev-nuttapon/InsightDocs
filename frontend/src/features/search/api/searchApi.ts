import { getJson } from '../../../shared/api/http';
import type { SearchDocumentsResponse, SearchFilters } from '../types';

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

  return getJson<SearchDocumentsResponse>(`/api/search/documents?${params.toString()}`, { accessToken });
}
