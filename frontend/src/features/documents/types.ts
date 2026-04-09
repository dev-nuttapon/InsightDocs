export type DocumentStatus = 'Draft' | 'InReview' | 'Approved' | 'Rejected' | 'Archived';

export type DocumentSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  ownerUserId: string | null;
  ownerDisplayName: string | null;
  controllerUserId: string | null;
  controllerDisplayName: string | null;
  status: DocumentStatus;
  versionCount: number;
  currentVersionNumber: number | null;
  createdAt: string;
  createdBy: string;
};

export type DocumentDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  ownerUserId: string | null;
  ownerDisplayName: string | null;
  controllerUserId: string | null;
  controllerDisplayName: string | null;
  status: DocumentStatus;
  versionCount: number;
  currentVersionNumber: number | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type DocumentVersion = {
  id: string;
  documentId: string;
  versionNumber: number;
  isCurrent: boolean;
  hasOriginalPdf: boolean;
  hasSignedPdf: boolean;
  checksum: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
};

export type ApprovalComment = {
  id: string;
  commentText: string;
  createdBy: string;
  createdAt: string;
};

export type DocumentApprovalHistoryItem = {
  id: string;
  documentId: string;
  action: 'Submitted' | 'Approved' | 'Rejected';
  fromStatus: DocumentStatus;
  toStatus: DocumentStatus;
  performedBy: string;
  performedAt: string;
  comments: ApprovalComment[];
};

export type PendingApproval = {
  documentId: string;
  documentTitle: string;
  status: DocumentStatus;
  currentVersionNumber: number | null;
  submittedBy: string;
  submittedAt: string;
  latestComment: string | null;
};

export type DocumentSignatureStatus = 'Pending' | 'Signed' | 'Rejected' | 'Cancelled';
export type DocumentSignatureActionType = 'Assigned' | 'Signed' | 'Rejected' | 'Cancelled';

export type DocumentSignatureAction = {
  id: string;
  actionType: DocumentSignatureActionType;
  performedBy: string;
  performedAt: string;
  comment: string | null;
  outputObjectKey: string | null;
};

export type DocumentSignatureRequest = {
  id: string;
  documentId: string;
  documentVersionId: string;
  signerUserId: string;
  signerUsername: string;
  signerDisplayName: string;
  signingOrder: number;
  status: DocumentSignatureStatus;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  signedAt: string | null;
  comment: string | null;
  isForCurrentVersion: boolean;
  actions: DocumentSignatureAction[];
};

export type PendingSignature = {
  signatureRequestId: string;
  documentId: string;
  documentTitle: string;
  documentVersionId: string;
  versionNumber: number;
  signingOrder: number;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  comment: string | null;
};

export type CreateDocumentInput = {
  title: string;
  description?: string;
  category?: string;
  ownerUserId?: string | null;
  controllerUserId?: string | null;
};

export type UpdateDocumentInput = {
  title: string;
  description?: string;
  category?: string;
  ownerUserId?: string | null;
  controllerUserId?: string | null;
};

export type CreateVersionInput = {
  changeSummary: string;
  originalPdf: File;
  signedPdf?: File | null;
};

export type ApprovalActionInput = {
  comment?: string;
};

export type AssignDocumentSignatureInput = {
  signerUserId: string;
  signingOrder: number;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  comment?: string;
};
