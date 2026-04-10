import { apiBaseUrl } from '../../auth/config/authConfig';
import type {
  ApprovalActionInput,
  AssignDocumentSignatureInput,
  CreateDocumentInput,
  CreateVersionInput,
  DocumentApprovalHistoryItem,
  DocumentDetail,
  DocumentSignatureRequest,
  DocumentSummary,
  DocumentVersion,
  PendingApproval,
  PendingSignature,
  UpdateDocumentInput,
} from '../types';
import type { AppUser } from '../../users/types';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function getDocuments(accessToken: string) {
  return request<DocumentSummary[]>('/api/documents', accessToken);
}

export function getDocument(id: string, accessToken: string) {
  return request<DocumentDetail>(`/api/documents/${id}`, accessToken);
}

export function createDocument(input: CreateDocumentInput, accessToken: string) {
  return request<DocumentDetail>('/api/documents', accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateDocument(id: string, input: UpdateDocumentInput, accessToken: string) {
  return request<DocumentDetail>(`/api/documents/${id}`, accessToken, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function getDocumentVersions(documentId: string, accessToken: string) {
  return request<DocumentVersion[]>(`/api/documents/${documentId}/versions`, accessToken);
}

export function getDocumentVersion(documentId: string, versionId: string, accessToken: string) {
  return request<DocumentVersion>(`/api/documents/${documentId}/versions/${versionId}`, accessToken);
}

export function createDocumentVersion(documentId: string, input: CreateVersionInput, accessToken: string) {
  const formData = new FormData();
  formData.set('changeSummary', input.changeSummary);
  formData.set('originalPdf', input.originalPdf);

  if (input.signedPdf) {
    formData.set('signedPdf', input.signedPdf);
  }

  return request<DocumentVersion>(`/api/documents/${documentId}/versions`, accessToken, {
    method: 'POST',
    body: formData,
  });
}

export function restoreDocumentVersion(documentId: string, versionId: string, accessToken: string) {
  return request<DocumentVersion>(`/api/documents/${documentId}/versions/${versionId}/restore`, accessToken, {
    method: 'POST',
  });
}

export function submitDocumentForReview(documentId: string, input: ApprovalActionInput, accessToken: string) {
  return request<DocumentDetail>(`/api/documents/${documentId}/submit-review`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function approveDocument(documentId: string, input: ApprovalActionInput, accessToken: string) {
  return request<DocumentDetail>(`/api/documents/${documentId}/approve`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function rejectDocument(documentId: string, input: ApprovalActionInput, accessToken: string) {
  return request<DocumentDetail>(`/api/documents/${documentId}/reject`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function getPendingApprovals(accessToken: string) {
  return request<PendingApproval[]>('/api/approvals/pending', accessToken);
}

export function getApprovalHistory(documentId: string, accessToken: string) {
  return request<DocumentApprovalHistoryItem[]>(`/api/documents/${documentId}/approval-history`, accessToken);
}

export function assignDocumentSignature(documentId: string, input: AssignDocumentSignatureInput, accessToken: string) {
  return request<DocumentSignatureRequest>(`/api/documents/${documentId}/signatures/assign`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function getDocumentSignatures(documentId: string, accessToken: string) {
  return request<DocumentSignatureRequest[]>(`/api/documents/${documentId}/signatures`, accessToken);
}

export function signDocumentSignature(documentId: string, signatureRequestId: string, input: ApprovalActionInput, accessToken: string) {
  return request<DocumentSignatureRequest>(`/api/documents/${documentId}/signatures/${signatureRequestId}/sign`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function rejectDocumentSignature(documentId: string, signatureRequestId: string, input: ApprovalActionInput, accessToken: string) {
  return request<DocumentSignatureRequest>(`/api/documents/${documentId}/signatures/${signatureRequestId}/reject`, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function getPendingSignatures(accessToken: string) {
  return request<PendingSignature[]>('/api/signatures/pending', accessToken);
}

export function getAssignableSigners(accessToken: string) {
  return request<AppUser[]>('/api/user-directory/signers', accessToken);
}
