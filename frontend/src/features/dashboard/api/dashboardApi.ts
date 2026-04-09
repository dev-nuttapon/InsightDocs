import { getJson } from '../../../shared/api/http';
import type { DashboardSummary, RecentDashboardActivity, RecentDashboardDocument } from '../types';

export function getDashboardSummary(accessToken: string) {
  return getJson<DashboardSummary>('/api/dashboard/summary', { accessToken });
}

export function getRecentDashboardDocuments(accessToken: string) {
  return getJson<RecentDashboardDocument[]>('/api/dashboard/recent-documents', { accessToken });
}

export function getRecentDashboardActivities(accessToken: string) {
  return getJson<RecentDashboardActivity[]>('/api/dashboard/recent-activities', { accessToken });
}
