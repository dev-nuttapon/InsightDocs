import type { DocumentStatus } from '../documents/types';

export type SignatureSummary = {
  totalRequests: number;
  pendingCount: number;
  signedCount: number;
  rejectedCount: number;
  fullySigned: boolean;
};

export type SearchDocumentResult = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: DocumentStatus;
  ownerUsername: string | null;
  ownerDisplayName: string | null;
  controllerUsername: string | null;
  controllerDisplayName: string | null;
  currentVersionNumber: number | null;
  signatureSummary: SignatureSummary;
};

export type SearchDocumentsResponse = {
  items: SearchDocumentResult[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type SearchFilters = {
  query: string;
  category: string;
  status: string;
  owner: string;
  controller: string;
  signer: string;
  archived: string;
  page: number;
  pageSize: number;
};
