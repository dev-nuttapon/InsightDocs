export type DashboardSummary = {
  totalDocuments: number;
  pendingApprovals: number;
  pendingSignatures: number;
  approvedDocuments: number;
  archivedDocuments: number;
};

export type RecentDashboardDocument = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  currentVersionNumber: number | null;
  ownerDisplayName: string | null;
  controllerDisplayName: string | null;
  lastActivityAt: string;
};

export type RecentDashboardActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  relatedDocumentId: string | null;
  relatedVersionId: string | null;
  relatedDocumentTitle: string | null;
  actorDisplayName: string | null;
  actorUsername: string | null;
  timestamp: string;
};
