import { getJson } from '../../../shared/api/http';
import type { AuditLogDetail, AuditLogFilters, AuditLogListResponse } from '../types';

export function getAuditLogs(accessToken: string, filters: AuditLogFilters) {
  const params = new URLSearchParams();

  if (filters.actor) params.set('actor', filters.actor);
  if (filters.action) params.set('action', filters.action);
  if (filters.documentId) params.set('documentId', filters.documentId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));

  return getJson<AuditLogListResponse>(`/api/audit-logs?${params.toString()}`, { accessToken });
}

export function getAuditLog(id: string, accessToken: string) {
  return getJson<AuditLogDetail>(`/api/audit-logs/${id}`, { accessToken });
}
