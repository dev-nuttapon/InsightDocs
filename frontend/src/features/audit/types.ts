export type AuditLogListItem = {
  id: string;
  actorUserId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  relatedDocumentId: string | null;
  relatedVersionId: string | null;
  timestamp: string;
};

export type AuditLogDetail = AuditLogListItem & {
  metadataJson: string | null;
};

export type AuditLogListResponse = {
  items: AuditLogListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type AuditLogFilters = {
  actor: string;
  action: string;
  documentId: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};
