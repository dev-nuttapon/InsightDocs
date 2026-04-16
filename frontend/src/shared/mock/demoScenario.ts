import type {
  AuditLogDetail,
  AuditLogFilters,
  AuditLogListResponse,
} from '../../features/audit/types';
import type { PasswordResetRequest } from '../../features/auth/api/authApi';
import type {
  DashboardSummary,
  RecentDashboardActivity,
  RecentDashboardDocument,
} from '../../features/dashboard/types';
import type { Language } from '../../i18n/messages';
import type {
  AssignDocumentSignatureInput,
  DocumentApprovalHistoryItem,
  DocumentDetail,
  DocumentSignatureRequest,
  DocumentSummary,
  DocumentVersion,
  PendingApproval,
  PendingSignature,
  CreateVersionInput,
  UpdateDocumentInput,
} from '../../features/documents/types';
import type { SearchDocumentResult, SearchDocumentsResponse, SearchFilters } from '../../features/search/types';
import type { AppUser } from '../../features/users/types';

export type DemoShowcaseDocument = {
  id: string;
  title: string;
  category: string;
  status: string;
  currentVersion: string;
  owner: string;
  controller: string;
  nextAction: string;
  pdfPath: string;
};

export type DemoScenarioKey = 'create' | 'version' | 'review' | 'approve' | 'sign' | 'audit';

export type DemoScenarioStage = {
  key: DemoScenarioKey;
  title: string;
  detail: string;
};

export type DemoScenarioState = {
  currentStep: number;
  badge: string;
  headline: string;
  nextStep: string;
  focus: string;
  primaryAction: {
    label: string;
    to: string;
  };
};

function cloneDemo<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const demoUsers: AppUser[] = [
  {
    id: 'demo-user-admin',
    username: 'demo.admin',
    email: 'demo.admin@insightdocs.local',
    displayName: 'Admin Insight',
    firstName: 'Admin',
    lastName: 'Insight',
    status: 'Active',
    createdAt: '2026-04-02T08:00:00Z',
    approvedAt: '2026-04-02T08:30:00Z',
    approvedBy: 'system',
    roles: ['insightdocs:admin'],
  },
  {
    id: 'demo-user-controller',
    username: 'nida.controller',
    email: 'nida.controller@insightdocs.local',
    displayName: 'Nida K.',
    firstName: 'Nida',
    lastName: 'K.',
    status: 'Active',
    createdAt: '2026-04-02T09:00:00Z',
    approvedAt: '2026-04-02T09:30:00Z',
    approvedBy: 'demo-user-admin',
    roles: ['insightdocs:document_controller'],
  },
  {
    id: 'demo-user-manager',
    username: 'suriya.manager',
    email: 'suriya.manager@insightdocs.local',
    displayName: 'Suriya P.',
    firstName: 'Suriya',
    lastName: 'P.',
    status: 'Active',
    createdAt: '2026-04-02T10:00:00Z',
    approvedAt: '2026-04-02T10:30:00Z',
    approvedBy: 'demo-user-admin',
    roles: ['insightdocs:manager'],
  },
  {
    id: 'demo-user-signer-1',
    username: 'mali.signer',
    email: 'mali.signer@insightdocs.local',
    displayName: 'Mali S.',
    firstName: 'Mali',
    lastName: 'S.',
    status: 'Active',
    createdAt: '2026-04-02T11:00:00Z',
    approvedAt: '2026-04-02T11:30:00Z',
    approvedBy: 'demo-user-admin',
    roles: ['insightdocs:signer'],
  },
  {
    id: 'demo-user-signer-2',
    username: 'preecha.signer',
    email: 'preecha.signer@insightdocs.local',
    displayName: 'Preecha T.',
    firstName: 'Preecha',
    lastName: 'T.',
    status: 'Active',
    createdAt: '2026-04-02T12:00:00Z',
    approvedAt: '2026-04-02T12:30:00Z',
    approvedBy: 'demo-user-admin',
    roles: ['insightdocs:signer'],
  },
];

const demoPasswordResetRequests: PasswordResetRequest[] = [
  {
    id: 'demo-pr-001',
    userId: 'demo-user-signer-2',
    username: 'preecha.signer',
    email: 'preecha.signer@insightdocs.local',
    displayName: 'Preecha T.',
    status: 'Pending',
    requestedByIdentifier: 'preecha.signer',
    requestedAt: '2026-04-10T09:00:00Z',
    reviewedAt: null,
    reviewedBy: null,
    reviewComment: null,
    resetTokenExpiresAt: null,
    resetUrl: null,
    completedAt: null,
  },
];

const demoDocumentSummaries: DocumentSummary[] = [
  {
    id: 'demo-contract-001',
    title: 'สัญญาว่าจ้างบริการที่ปรึกษา',
    description: 'เอกสารตัวอย่างสำหรับสาธิต workflow ตั้งแต่สร้างเวอร์ชันจนถึงอนุมัติและส่งลงนาม',
    category: 'Legal',
    ownerUserId: 'demo-user-controller',
    ownerDisplayName: 'Nida K.',
    controllerUserId: 'demo-user-controller',
    controllerDisplayName: 'Nida K.',
    status: 'Approved',
    versionCount: 3,
    currentVersionNumber: 3,
    createdAt: '2026-04-05T08:30:00Z',
    createdBy: 'nida.controller',
  },
  {
    id: 'demo-policy-014',
    title: 'ระเบียบการอนุมัติค่าใช้จ่ายปี 2026',
    description: 'ตัวอย่างเอกสารนโยบายที่อยู่ระหว่างการพิจารณาอนุมัติ',
    category: 'Finance',
    ownerUserId: 'demo-user-controller',
    ownerDisplayName: 'Nida K.',
    controllerUserId: 'demo-user-controller',
    controllerDisplayName: 'Nida K.',
    status: 'InReview',
    versionCount: 2,
    currentVersionNumber: 2,
    createdAt: '2026-04-07T10:00:00Z',
    createdBy: 'nida.controller',
  },
  {
    id: 'demo-hr-008',
    title: 'หนังสือแต่งตั้งพนักงานใหม่',
    description: 'เอกสาร HR ตัวอย่างที่ยังอยู่ในขั้นเตรียมข้อมูลก่อนส่งเข้าพิจารณา',
    category: 'HR',
    ownerUserId: 'demo-user-controller',
    ownerDisplayName: 'Nida K.',
    controllerUserId: 'demo-user-controller',
    controllerDisplayName: 'Nida K.',
    status: 'Draft',
    versionCount: 1,
    currentVersionNumber: 1,
    createdAt: '2026-04-09T03:30:00Z',
    createdBy: 'nida.controller',
  },
];

const demoDocumentDetails: Record<string, DocumentDetail> = {
  'demo-contract-001': {
    ...demoDocumentSummaries[0],
    updatedAt: '2026-04-10T09:45:00Z',
    updatedBy: 'nida.controller',
  },
  'demo-policy-014': {
    ...demoDocumentSummaries[1],
    updatedAt: '2026-04-10T04:15:00Z',
    updatedBy: 'nida.controller',
  },
  'demo-hr-008': {
    ...demoDocumentSummaries[2],
    updatedAt: '2026-04-10T01:25:00Z',
    updatedBy: 'nida.controller',
  },
};

const demoVersions: Record<string, DocumentVersion[]> = {
  'demo-contract-001': [
    {
      id: 'demo-contract-001-v3',
      documentId: 'demo-contract-001',
      versionNumber: 3,
      isCurrent: true,
      hasOriginalPdf: true,
      hasSignedPdf: true,
      checksum: 'sha256:6ab4f4d362-curr-contract',
      changeSummary: 'ปรับขอบเขตงานและเพิ่มตำแหน่งลายเซ็นสำหรับผู้อนุมัติสองลำดับ',
      createdBy: 'nida.controller',
      createdAt: '2026-04-10T09:40:00Z',
    },
    {
      id: 'demo-contract-001-v2',
      documentId: 'demo-contract-001',
      versionNumber: 2,
      isCurrent: false,
      hasOriginalPdf: true,
      hasSignedPdf: false,
      checksum: 'sha256:5be3c0af92-prev-contract',
      changeSummary: 'เพิ่มภาคผนวกเงื่อนไขการชำระเงิน',
      createdBy: 'nida.controller',
      createdAt: '2026-04-09T07:15:00Z',
    },
    {
      id: 'demo-contract-001-v1',
      documentId: 'demo-contract-001',
      versionNumber: 1,
      isCurrent: false,
      hasOriginalPdf: true,
      hasSignedPdf: false,
      checksum: 'sha256:1230ab9911-init-contract',
      changeSummary: 'ฉบับร่างเริ่มต้นของสัญญา',
      createdBy: 'nida.controller',
      createdAt: '2026-04-05T08:30:00Z',
    },
  ],
  'demo-policy-014': [
    {
      id: 'demo-policy-014-v2',
      documentId: 'demo-policy-014',
      versionNumber: 2,
      isCurrent: true,
      hasOriginalPdf: true,
      hasSignedPdf: false,
      checksum: 'sha256:88fa4a21bb-policy-current',
      changeSummary: 'อัปเดตวงเงินอนุมัติและแนบหมายเหตุประกอบฉบับปี 2026',
      createdBy: 'nida.controller',
      createdAt: '2026-04-10T04:10:00Z',
    },
    {
      id: 'demo-policy-014-v1',
      documentId: 'demo-policy-014',
      versionNumber: 1,
      isCurrent: false,
      hasOriginalPdf: true,
      hasSignedPdf: false,
      checksum: 'sha256:77bca88991-policy-init',
      changeSummary: 'ฉบับตั้งต้นสำหรับการพิจารณา',
      createdBy: 'nida.controller',
      createdAt: '2026-04-07T10:00:00Z',
    },
  ],
  'demo-hr-008': [
    {
      id: 'demo-hr-008-v1',
      documentId: 'demo-hr-008',
      versionNumber: 1,
      isCurrent: true,
      hasOriginalPdf: true,
      hasSignedPdf: false,
      checksum: 'sha256:cc013ab998-hr-init',
      changeSummary: 'ฉบับต้นแบบสำหรับเอกสารแต่งตั้งพนักงานใหม่',
      createdBy: 'nida.controller',
      createdAt: '2026-04-09T03:30:00Z',
    },
  ],
};

const demoApprovalHistory: Record<string, DocumentApprovalHistoryItem[]> = {
  'demo-contract-001': [
    {
      id: 'approval-demo-contract-001-submit',
      documentId: 'demo-contract-001',
      action: 'Submitted',
      fromStatus: 'Draft',
      toStatus: 'InReview',
      performedBy: 'Nida K.',
      performedAt: '2026-04-10T09:41:00Z',
      comments: [
        {
          id: 'approval-comment-demo-contract-001-submit',
          commentText: 'ส่งตรวจฉบับปรับปรุงเงื่อนไขการชำระเงินและกรอบการลงนาม',
          createdBy: 'Nida K.',
          createdAt: '2026-04-10T09:41:00Z',
        },
      ],
    },
    {
      id: 'approval-demo-contract-001-approve',
      documentId: 'demo-contract-001',
      action: 'Approved',
      fromStatus: 'InReview',
      toStatus: 'Approved',
      performedBy: 'Suriya P.',
      performedAt: '2026-04-10T10:05:00Z',
      comments: [
        {
          id: 'approval-comment-demo-contract-001-approve',
          commentText: 'เนื้อหาและลำดับผู้ลงนามถูกต้องตาม workflow ที่กำหนด',
          createdBy: 'Suriya P.',
          createdAt: '2026-04-10T10:05:00Z',
        },
      ],
    },
  ],
  'demo-policy-014': [
    {
      id: 'approval-demo-policy-014-submit',
      documentId: 'demo-policy-014',
      action: 'Submitted',
      fromStatus: 'Draft',
      toStatus: 'InReview',
      performedBy: 'Nida K.',
      performedAt: '2026-04-10T04:20:00Z',
      comments: [
        {
          id: 'approval-comment-demo-policy-014-submit',
          commentText: 'ขอให้ตรวจวงเงินอนุมัติและเงื่อนไขการเบิกจ่ายฉบับล่าสุด',
          createdBy: 'Nida K.',
          createdAt: '2026-04-10T04:20:00Z',
        },
      ],
    },
  ],
  'demo-hr-008': [],
};

const demoSignatures: Record<string, DocumentSignatureRequest[]> = {
  'demo-contract-001': [
    {
      id: 'signature-demo-contract-001-1',
      documentId: 'demo-contract-001',
      documentVersionId: 'demo-contract-001-v3',
      signerUserId: 'demo-user-signer-1',
      signerUsername: 'mali.signer',
      signerDisplayName: 'Mali S.',
      signingOrder: 1,
      status: 'Signed',
      pageNumber: 3,
      positionX: 80,
      positionY: 620,
      width: 180,
      height: 72,
      signedAt: '2026-04-10T10:35:00Z',
      comment: 'ลงนามตามลำดับแรกเรียบร้อย',
      isForCurrentVersion: true,
      actions: [
        {
          id: 'signature-demo-contract-001-1-assigned',
          actionType: 'Assigned',
          performedBy: 'Nida K.',
          performedAt: '2026-04-10T10:10:00Z',
          comment: 'มอบหมายลำดับแรก',
          outputObjectKey: null,
        },
        {
          id: 'signature-demo-contract-001-1-signed',
          actionType: 'Signed',
          performedBy: 'Mali S.',
          performedAt: '2026-04-10T10:35:00Z',
          comment: 'ลงนามแล้ว',
          outputObjectKey: 'minio://demo-contract-001/v3/signed-step-1.pdf',
        },
      ],
    },
    {
      id: 'signature-demo-contract-001-2',
      documentId: 'demo-contract-001',
      documentVersionId: 'demo-contract-001-v3',
      signerUserId: 'demo-user-signer-2',
      signerUsername: 'preecha.signer',
      signerDisplayName: 'Preecha T.',
      signingOrder: 2,
      status: 'Pending',
      pageNumber: 3,
      positionX: 320,
      positionY: 620,
      width: 180,
      height: 72,
      signedAt: null,
      comment: 'รอลงนามลำดับสุดท้าย',
      isForCurrentVersion: true,
      actions: [
        {
          id: 'signature-demo-contract-001-2-assigned',
          actionType: 'Assigned',
          performedBy: 'Nida K.',
          performedAt: '2026-04-10T10:10:00Z',
          comment: 'มอบหมายลำดับที่สอง',
          outputObjectKey: null,
        },
      ],
    },
  ],
  'demo-policy-014': [],
  'demo-hr-008': [],
};

const demoAuditLogs: AuditLogDetail[] = [
  {
    id: 'audit-demo-001',
    actorUserId: 'demo-user-controller',
    actorUsername: 'nida.controller',
    actorDisplayName: 'Nida K.',
    action: 'document.version.created',
    entityType: 'DocumentVersion',
    entityId: 'demo-contract-001-v3',
    relatedDocumentId: 'demo-contract-001',
    relatedVersionId: 'demo-contract-001-v3',
    timestamp: '2026-04-10T09:40:00Z',
    metadataJson: JSON.stringify({
      versionNumber: 3,
      changeSummary: 'ปรับขอบเขตงานและเพิ่มตำแหน่งลายเซ็นสำหรับผู้อนุมัติสองลำดับ',
      source: 'demo-mode',
    }),
  },
  {
    id: 'audit-demo-002',
    actorUserId: 'demo-user-controller',
    actorUsername: 'nida.controller',
    actorDisplayName: 'Nida K.',
    action: 'document.approval.submitted',
    entityType: 'Document',
    entityId: 'demo-policy-014',
    relatedDocumentId: 'demo-policy-014',
    relatedVersionId: 'demo-policy-014-v2',
    timestamp: '2026-04-10T04:20:00Z',
    metadataJson: JSON.stringify({
      status: 'InReview',
      note: 'ขอให้ตรวจวงเงินอนุมัติและเงื่อนไขการเบิกจ่ายฉบับล่าสุด',
    }),
  },
  {
    id: 'audit-demo-003',
    actorUserId: 'demo-user-manager',
    actorUsername: 'suriya.manager',
    actorDisplayName: 'Suriya P.',
    action: 'document.approval.approved',
    entityType: 'Document',
    entityId: 'demo-contract-001',
    relatedDocumentId: 'demo-contract-001',
    relatedVersionId: 'demo-contract-001-v3',
    timestamp: '2026-04-10T10:05:00Z',
    metadataJson: JSON.stringify({
      status: 'Approved',
      comment: 'เนื้อหาและลำดับผู้ลงนามถูกต้องตาม workflow ที่กำหนด',
    }),
  },
  {
    id: 'audit-demo-004',
    actorUserId: 'demo-user-signer-1',
    actorUsername: 'mali.signer',
    actorDisplayName: 'Mali S.',
    action: 'document.signature.signed',
    entityType: 'DocumentSignatureRequest',
    entityId: 'signature-demo-contract-001-1',
    relatedDocumentId: 'demo-contract-001',
    relatedVersionId: 'demo-contract-001-v3',
    timestamp: '2026-04-10T10:35:00Z',
    metadataJson: JSON.stringify({
      signingOrder: 1,
      pageNumber: 3,
      outputObjectKey: 'minio://demo-contract-001/v3/signed-step-1.pdf',
    }),
  },
];

export const DEMO_SHOWCASE_DOCUMENTS: DemoShowcaseDocument[] = [
  {
    id: 'demo-contract-001',
    title: 'สัญญาว่าจ้างบริการที่ปรึกษา',
    category: 'Legal',
    status: 'Approved',
    currentVersion: 'v3',
    owner: 'Nida K.',
    controller: 'Nida K.',
    nextAction: 'รอลงนามลำดับที่ 2 และติดตาม signed PDF ฉบับสุดท้าย',
    pdfPath: '/mock-pdfs/consulting-services-contract.pdf',
  },
  {
    id: 'demo-policy-014',
    title: 'ระเบียบการอนุมัติค่าใช้จ่ายปี 2026',
    category: 'Finance',
    status: 'InReview',
    currentVersion: 'v2',
    owner: 'Nida K.',
    controller: 'Nida K.',
    nextAction: 'ผู้จัดการกำลังพิจารณาอนุมัติฉบับปรับปรุงล่าสุด',
    pdfPath: '/mock-pdfs/expense-approval-policy-2026.pdf',
  },
  {
    id: 'demo-hr-008',
    title: 'หนังสือแต่งตั้งพนักงานใหม่',
    category: 'HR',
    status: 'Draft',
    currentVersion: 'v1',
    owner: 'Nida K.',
    controller: 'Nida K.',
    nextAction: 'เตรียมอัปโหลดเวอร์ชันถัดไปก่อนส่งเข้าสู่ review',
    pdfPath: '/mock-pdfs/employee-appointment-letter.pdf',
  },
];

const demoLocalizedDocuments: Record<string, Record<Language, {
  title: string;
  description: string;
  category: string;
  nextAction: string;
}>> = {
  'demo-contract-001': {
    th: {
      title: 'สัญญาว่าจ้างบริการที่ปรึกษา',
      description: 'เอกสารตัวอย่างสำหรับสาธิต workflow ตั้งแต่สร้างเวอร์ชันจนถึงอนุมัติและส่งลงนาม',
      category: 'กฎหมาย',
      nextAction: 'รอลงนามลำดับที่ 2 และติดตาม signed PDF ฉบับสุดท้าย',
    },
    en: {
      title: 'Consulting Services Agreement',
      description: 'Sample document for demonstrating the workflow from version control through approval and signature.',
      category: 'Legal',
      nextAction: 'Waiting for signer 2 and the final signed PDF output.',
    },
  },
  'demo-policy-014': {
    th: {
      title: 'ระเบียบการอนุมัติค่าใช้จ่ายปี 2026',
      description: 'ตัวอย่างเอกสารนโยบายที่อยู่ระหว่างการพิจารณาอนุมัติ',
      category: 'การเงิน',
      nextAction: 'ผู้จัดการกำลังพิจารณาอนุมัติฉบับปรับปรุงล่าสุด',
    },
    en: {
      title: '2026 Expense Approval Policy',
      description: 'Sample policy document currently waiting for manager approval.',
      category: 'Finance',
      nextAction: 'Manager review is pending on the latest revised version.',
    },
  },
  'demo-hr-008': {
    th: {
      title: 'หนังสือแต่งตั้งพนักงานใหม่',
      description: 'เอกสาร HR ตัวอย่างที่ยังอยู่ในขั้นเตรียมข้อมูลก่อนส่งเข้าพิจารณา',
      category: 'ทรัพยากรบุคคล',
      nextAction: 'เตรียมอัปโหลดเวอร์ชันถัดไปก่อนส่งเข้าสู่ review',
    },
    en: {
      title: 'New Employee Appointment Letter',
      description: 'Sample HR document still being prepared before it enters the review workflow.',
      category: 'HR',
      nextAction: 'Prepare the next version before submitting it for review.',
    },
  },
};

export const DEMO_SCENARIO_STAGES: DemoScenarioStage[] = [
  {
    key: 'create',
    title: 'Create',
    detail: 'ลงทะเบียนเอกสารใหม่และกำหนด metadata หลัก',
  },
  {
    key: 'version',
    title: 'Version',
    detail: 'อัปโหลด PDF ล่าสุดและเก็บประวัติการเปลี่ยนแปลง',
  },
  {
    key: 'review',
    title: 'Review',
    detail: 'ส่งเอกสารเข้าคิวพิจารณาเพื่อให้ผู้จัดการตรวจสอบ',
  },
  {
    key: 'approve',
    title: 'Approve',
    detail: 'ผู้จัดการอนุมัติเอกสารและปลดล็อกขั้นตอนถัดไป',
  },
  {
    key: 'sign',
    title: 'Sign',
    detail: 'กำหนดผู้ลงนามและลงนามตามลำดับที่ตั้งไว้',
  },
  {
    key: 'audit',
    title: 'Audit',
    detail: 'ติดตามย้อนกลับได้ว่าใครทำอะไรกับเอกสารนี้บ้าง',
  },
];

type DemoSnapshot = {
  users: AppUser[];
  documentSummaries: DocumentSummary[];
  documentDetails: Record<string, DocumentDetail>;
  versions: Record<string, DocumentVersion[]>;
  approvalHistory: Record<string, DocumentApprovalHistoryItem[]>;
  signatures: Record<string, DocumentSignatureRequest[]>;
  auditLogs: AuditLogDetail[];
  passwordResetRequests: PasswordResetRequest[];
};

const DEMO_STORAGE_KEY = 'insightdocs.demo.snapshot.v1';

function buildInitialDemoSnapshot(): DemoSnapshot {
  return cloneDemo({
    users: demoUsers,
    documentSummaries: demoDocumentSummaries,
    documentDetails: demoDocumentDetails,
    versions: demoVersions,
    approvalHistory: demoApprovalHistory,
    signatures: demoSignatures,
    auditLogs: demoAuditLogs,
    passwordResetRequests: demoPasswordResetRequests,
  });
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readSnapshot(): DemoSnapshot {
  if (!canUseStorage()) {
    return buildInitialDemoSnapshot();
  }

  const raw = window.sessionStorage.getItem(DEMO_STORAGE_KEY);

  if (!raw) {
    const initial = buildInitialDemoSnapshot();
    writeSnapshot(initial);
    return initial;
  }

  try {
    return JSON.parse(raw) as DemoSnapshot;
  } catch {
    const initial = buildInitialDemoSnapshot();
    writeSnapshot(initial);
    return initial;
  }
}

function writeSnapshot(snapshot: DemoSnapshot) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
}

function updateSnapshot(mutator: (snapshot: DemoSnapshot) => void) {
  const snapshot = readSnapshot();
  mutator(snapshot);
  writeSnapshot(snapshot);
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function syncDocumentSummary(snapshot: DemoSnapshot, documentId: string) {
  const detail = snapshot.documentDetails[documentId];

  if (!detail) {
    return;
  }

  const index = snapshot.documentSummaries.findIndex((item) => item.id === documentId);

  if (index >= 0) {
    snapshot.documentSummaries[index] = {
      ...snapshot.documentSummaries[index],
      ...detail,
    };
    return;
  }

  snapshot.documentSummaries.unshift({
    ...detail,
  });
}

function derivePendingApprovals(snapshot: DemoSnapshot): PendingApproval[] {
  return snapshot.documentSummaries
    .filter((document) => document.status === 'InReview')
    .map((document) => {
      const latestSubmitted = (snapshot.approvalHistory[document.id] ?? []).find((item) => item.action === 'Submitted');
      const latestComment = latestSubmitted?.comments?.[0]?.commentText ?? null;

      return {
        documentId: document.id,
        documentTitle: document.title,
        status: document.status,
        currentVersionNumber: document.currentVersionNumber,
        submittedBy: latestSubmitted?.performedBy ?? document.ownerDisplayName ?? document.createdBy,
        submittedAt: latestSubmitted?.performedAt ?? snapshot.documentDetails[document.id]?.updatedAt ?? document.createdAt,
        latestComment,
      };
    })
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

function derivePendingSignatures(snapshot: DemoSnapshot): PendingSignature[] {
  return Object.values(snapshot.signatures)
    .flat()
    .filter((signature) => signature.status === 'Pending' && signature.isForCurrentVersion)
    .map((signature) => {
      const document = snapshot.documentDetails[signature.documentId];
      const version = (snapshot.versions[signature.documentId] ?? []).find((item) => item.id === signature.documentVersionId);

      return {
        signatureRequestId: signature.id,
        documentId: signature.documentId,
        documentTitle: document?.title ?? signature.documentId,
        documentVersionId: signature.documentVersionId,
        versionNumber: version?.versionNumber ?? document?.currentVersionNumber ?? 1,
        signingOrder: signature.signingOrder,
        pageNumber: signature.pageNumber,
        positionX: signature.positionX,
        positionY: signature.positionY,
        width: signature.width,
        height: signature.height,
        comment: signature.comment ?? null,
      };
    })
    .sort((left, right) => left.signingOrder - right.signingOrder);
}

function buildSignatureSummaryFromSnapshot(snapshot: DemoSnapshot, documentId: string) {
  const requests = snapshot.signatures[documentId] ?? [];

  return {
    totalRequests: requests.length,
    pendingCount: requests.filter((request) => request.status === 'Pending').length,
    signedCount: requests.filter((request) => request.status === 'Signed').length,
    rejectedCount: requests.filter((request) => request.status === 'Rejected').length,
    fullySigned: requests.length > 0 && requests.every((request) => request.status === 'Signed'),
  };
}

function toDemoSearchItem(snapshot: DemoSnapshot, document: DocumentSummary): SearchDocumentResult {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    category: document.category,
    status: document.status,
    ownerUsername: null,
    ownerDisplayName: document.ownerDisplayName,
    controllerUsername: null,
    controllerDisplayName: document.controllerDisplayName,
    currentVersionNumber: document.currentVersionNumber,
    signatureSummary: buildSignatureSummaryFromSnapshot(snapshot, document.id),
  };
}

function appendAuditLog(
  snapshot: DemoSnapshot,
  entry: {
    actorUserId?: string | null;
    actorUsername?: string | null;
    actorDisplayName?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    relatedDocumentId?: string | null;
    relatedVersionId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  snapshot.auditLogs.unshift({
    id: createId('audit-demo'),
    actorUserId: entry.actorUserId ?? null,
    actorUsername: entry.actorUsername ?? null,
    actorDisplayName: entry.actorDisplayName ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    relatedDocumentId: entry.relatedDocumentId ?? null,
    relatedVersionId: entry.relatedVersionId ?? null,
    timestamp: nowIso(),
    metadataJson: JSON.stringify(entry.metadata ?? {}),
  });
}

export function resetDemoScenario() {
  writeSnapshot(buildInitialDemoSnapshot());
}

type DemoActor = {
  id?: string | null;
  username?: string | null;
  displayName?: string | null;
};

function localizeDocumentSummary(document: DocumentSummary, language: Language): DocumentSummary {
  const localized = demoLocalizedDocuments[document.id]?.[language];

  if (!localized) {
    return document;
  }

  return {
    ...document,
    title: localized.title,
    description: localized.description,
    category: localized.category,
  };
}

function localizeDocumentDetail(document: DocumentDetail, language: Language): DocumentDetail {
  const localized = demoLocalizedDocuments[document.id]?.[language];

  if (!localized) {
    return document;
  }

  return {
    ...document,
    title: localized.title,
    description: localized.description,
    category: localized.category,
  };
}

function localizeShowcaseDocument(document: DemoShowcaseDocument, language: Language): DemoShowcaseDocument {
  const localized = demoLocalizedDocuments[document.id]?.[language];

  if (!localized) {
    return document;
  }

  return {
    ...document,
    title: localized.title,
    category: localized.category,
    nextAction: localized.nextAction,
  };
}

export function getDemoDocumentSummaries(language: Language = 'th') {
  return cloneDemo(readSnapshot().documentSummaries.map((document) => localizeDocumentSummary(document, language)));
}

export function getDemoShowcaseDocument(id: string, language: Language = 'th') {
  const snapshot = readSnapshot();
  const summary = snapshot.documentSummaries.find((item) => item.id === id);
  const document = DEMO_SHOWCASE_DOCUMENTS.find((item) => item.id === id);

  if (summary && document) {
    return cloneDemo(localizeShowcaseDocument({
      ...document,
      category: localizeDocumentSummary(summary, language).category ?? document.category,
      status: summary.status,
      currentVersion: summary.currentVersionNumber ? `v${summary.currentVersionNumber}` : document.currentVersion,
      owner: summary.ownerDisplayName ?? document.owner,
      controller: summary.controllerDisplayName ?? document.controller,
    }, language));
  }

  return document ? cloneDemo(localizeShowcaseDocument(document, language)) : null;
}

export function getDemoScenarioStages(language: Language = 'th') {
  if (language === 'en') {
    return [
      { key: 'create', title: 'Create', detail: 'Register the document and define core metadata.' },
      { key: 'version', title: 'Version', detail: 'Upload the latest PDF and preserve change history.' },
      { key: 'review', title: 'Review', detail: 'Submit the document into the manager review queue.' },
      { key: 'approve', title: 'Approve', detail: 'Manager approval unlocks the next stage.' },
      { key: 'sign', title: 'Sign', detail: 'Assign signers and complete signatures in sequence.' },
      { key: 'audit', title: 'Audit', detail: 'Trace every important action on the document.' },
    ] satisfies DemoScenarioStage[];
  }

  return DEMO_SCENARIO_STAGES;
}

export function getDemoScenarioState(documentId?: string, language: Language = 'th'): DemoScenarioState {
  const snapshot = readSnapshot();

  switch (documentId) {
    case 'demo-contract-001': {
      const pendingSignatures = (snapshot.signatures[documentId] ?? []).filter((item) => item.status === 'Pending').length;

      return language === 'en'
        ? {
            currentStep: pendingSignatures === 0 ? 6 : 5,
            badge: pendingSignatures === 0 ? 'Signed and Auditable' : 'Ready for Signature',
            headline: pendingSignatures === 0
              ? 'This document is fully signed and ready to demonstrate end-to-end audit evidence.'
              : 'This document is approved and waiting for the final signer in sequence.',
            nextStep: pendingSignatures === 0
              ? 'Open the audit log or document detail page to show traceability after signing.'
              : 'Have signer 2 open the signature queue and sign the current version.',
            focus: pendingSignatures === 0 ? 'Audit Evidence' : 'Signature Sequence',
            primaryAction: {
              label: pendingSignatures === 0 ? 'Open Audit Logs' : 'Open signature queue',
              to: pendingSignatures === 0 ? '/audit-logs' : '/signatures',
            },
          }
        : {
            currentStep: pendingSignatures === 0 ? 6 : 5,
            badge: pendingSignatures === 0 ? 'Signed and Auditable' : 'Ready for Signature',
            headline: pendingSignatures === 0
              ? 'เอกสารฉบับนี้ลงนามครบแล้วและพร้อมใช้เป็นตัวอย่างของ audit trail แบบ end-to-end'
              : 'เอกสารฉบับนี้ผ่านอนุมัติแล้วและกำลังรอลงนามลำดับสุดท้าย',
            nextStep: pendingSignatures === 0
              ? 'เปิด audit log หรือหน้ารายละเอียดเอกสารเพื่อเล่าหลักฐานการเปลี่ยนแปลงย้อนหลัง'
              : 'ให้ผู้ลงนามลำดับที่ 2 เปิดคิวลงนามและเซ็นเอกสารฉบับปัจจุบัน',
            focus: pendingSignatures === 0 ? 'Audit Evidence' : 'Signature Sequence',
            primaryAction: {
              label: pendingSignatures === 0 ? 'เปิด Audit Log' : 'เปิดคิวลงนาม',
              to: pendingSignatures === 0 ? '/audit-logs' : '/signatures',
            },
          };
    }
    case 'demo-policy-014': {
      const status = snapshot.documentDetails[documentId]?.status ?? 'InReview';

      return language === 'en'
        ? {
            currentStep: status === 'Approved' ? 4 : 3,
            badge: status === 'Approved' ? 'Approved and Ready for Signature' : 'Waiting for Approval',
            headline: status === 'Approved'
              ? 'This document is approved and ready for signer assignment.'
              : 'This document is still in the manager review queue and needs a decision.',
            nextStep: status === 'Approved'
              ? 'Open the document to assign signers or explain the hand-off from approval to signature.'
              : 'Open the approval queue to review context and approve or reject.',
            focus: status === 'Approved' ? 'Approval Completed' : 'Manager Review',
            primaryAction: {
              label: status === 'Approved' ? 'Open document detail' : 'Open approval queue',
              to: status === 'Approved' ? `/documents/${documentId}` : '/approvals',
            },
          }
        : {
            currentStep: status === 'Approved' ? 4 : 3,
            badge: status === 'Approved' ? 'Approved and Ready for Signature' : 'Waiting for Approval',
            headline: status === 'Approved'
              ? 'เอกสารฉบับนี้ได้รับการอนุมัติแล้วและพร้อมเข้าสู่ขั้นกำหนดผู้ลงนาม'
              : 'เอกสารฉบับนี้อยู่ในคิวพิจารณาและต้องการการตัดสินใจจากผู้จัดการ',
            nextStep: status === 'Approved'
              ? 'เปิดหน้าเอกสารเพื่อกำหนดลำดับผู้ลงนามหรือเล่าการส่งต่อจาก approval ไป signature'
              : 'เปิดคิวอนุมัติเพื่ออ่านรายละเอียดและตัดสินใจ approve หรือ reject',
            focus: status === 'Approved' ? 'Approval Completed' : 'Manager Review',
            primaryAction: {
              label: status === 'Approved' ? 'เปิดหน้าเอกสาร' : 'เปิดคิวอนุมัติ',
              to: status === 'Approved' ? `/documents/${documentId}` : '/approvals',
            },
          };
    }
    case 'demo-hr-008':
      return language === 'en'
        ? {
            currentStep: 2,
            badge: 'Version Update Required',
            headline: 'This document is still being prepared before it can enter the review workflow.',
            nextStep: 'Upload the next PDF version and then submit it into review.',
            focus: 'Version Preparation',
            primaryAction: {
              label: 'Manage versions',
              to: '/documents/demo-hr-008',
            },
          }
        : {
            currentStep: 2,
            badge: 'Version Update Required',
            headline: 'เอกสารฉบับนี้ยังอยู่ช่วงเตรียมเวอร์ชันล่าสุดก่อนส่งเข้าตรวจสอบ',
            nextStep: 'อัปโหลด PDF เวอร์ชันถัดไปและเตรียม submit เข้าสู่ review',
            focus: 'Version Preparation',
            primaryAction: {
              label: 'จัดการเวอร์ชัน',
              to: '/documents/demo-hr-008',
            },
          };
    default:
      if (derivePendingSignatures(snapshot).length === 0 && derivePendingApprovals(snapshot).length === 0) {
        return language === 'en'
          ? {
              currentStep: 6,
              badge: 'Workflow Completed',
              headline: 'This demo has completed the full chain from version to approval, signature, and audit.',
              nextStep: 'Open the primary document or the audit log to close the presentation with traceability evidence.',
              focus: 'End-to-End Narrative',
              primaryAction: {
                label: 'Open Audit Logs',
                to: '/audit-logs',
              },
            }
          : {
              currentStep: 6,
              badge: 'Workflow Completed',
              headline: 'เดโมชุดนี้เดินครบตั้งแต่สร้างเวอร์ชัน อนุมัติ ลงนาม และพร้อมเปิด audit trail ต่อได้ทันที',
              nextStep: 'เปิดเอกสารหลักหรือ audit log เพื่อสรุปความน่าเชื่อถือของระบบในช่วงปิดการนำเสนอ',
              focus: 'End-to-End Narrative',
              primaryAction: {
                label: 'เปิด Audit Log',
                to: '/audit-logs',
              },
            };
      }

      return language === 'en'
        ? {
            currentStep: 4,
            badge: 'Workflow Demo',
            headline: 'See the full document story from creation through approval and signature in one scenario.',
            nextStep: 'Open the sample document to continue through versions, approvals, signatures, and the audit trail.',
            focus: 'End-to-End Narrative',
            primaryAction: {
              label: 'Start the workflow',
              to: '/documents/demo-contract-001',
            },
          }
        : {
            currentStep: 4,
            badge: 'Workflow Demo',
            headline: 'ดู flow ตั้งแต่สร้างเอกสารจนถึงการอนุมัติและลงนามจาก scenario เดียว',
            nextStep: 'เปิดเอกสารตัวอย่างเพื่อเริ่มดู version, approval, signature และ audit trail ต่อเนื่องกัน',
            focus: 'End-to-End Narrative',
            primaryAction: {
              label: 'เริ่มดู workflow',
              to: '/documents/demo-contract-001',
            },
          };
  }
}

export function getDemoDocumentDetail(id: string, language: Language = 'th') {
  const detail = readSnapshot().documentDetails[id];
  return detail ? cloneDemo(localizeDocumentDetail(detail, language)) : null;
}

export function getDemoDocumentVersions(id: string, _language: Language = 'th') {
  return cloneDemo(readSnapshot().versions[id] ?? []);
}

export function getDemoApprovalHistory(id: string, _language: Language = 'th') {
  return cloneDemo(readSnapshot().approvalHistory[id] ?? []);
}

export function getDemoDocumentSignatures(id: string, _language: Language = 'th') {
  return cloneDemo(readSnapshot().signatures[id] ?? []);
}

export function getDemoAssignableSigners() {
  return cloneDemo(readSnapshot().users.filter((user) => user.roles.includes('insightdocs:signer')));
}

export function getDemoPendingApprovals(language: Language = 'th') {
  return cloneDemo(derivePendingApprovals(readSnapshot()).map((item) => ({
    ...item,
    documentTitle: demoLocalizedDocuments[item.documentId]?.[language]?.title ?? item.documentTitle,
  })));
}

export function getDemoPendingSignatures(language: Language = 'th') {
  return cloneDemo(derivePendingSignatures(readSnapshot()).map((item) => ({
    ...item,
    documentTitle: demoLocalizedDocuments[item.documentId]?.[language]?.title ?? item.documentTitle,
  })));
}

export function getDemoDashboardSummary(): DashboardSummary {
  const snapshot = readSnapshot();
  const pendingApprovals = derivePendingApprovals(snapshot);
  const pendingSignatures = derivePendingSignatures(snapshot);

  return {
    totalDocuments: snapshot.documentSummaries.length,
    pendingApprovals: pendingApprovals.length,
    pendingSignatures: pendingSignatures.length,
    approvedDocuments: snapshot.documentSummaries.filter((document) => document.status === 'Approved').length,
    archivedDocuments: snapshot.documentSummaries.filter((document) => document.status === 'Archived').length,
  };
}

export function getDemoRecentDashboardDocuments(language: Language = 'th') {
  const snapshot = readSnapshot();
  const lastActivityMap = new Map<string, string>([
    ['demo-contract-001', '2026-04-10T10:35:00Z'],
    ['demo-policy-014', '2026-04-10T04:20:00Z'],
    ['demo-hr-008', '2026-04-09T03:30:00Z'],
  ]);

  const items: RecentDashboardDocument[] = snapshot.documentSummaries.map((document) => {
    const localized = localizeDocumentSummary(document, language);

    return {
    id: document.id,
    title: localized.title,
    category: localized.category,
    status: document.status,
    currentVersionNumber: document.currentVersionNumber,
    ownerDisplayName: document.ownerDisplayName,
    controllerDisplayName: document.controllerDisplayName,
    lastActivityAt: lastActivityMap.get(document.id) ?? snapshot.documentDetails[document.id]?.updatedAt ?? document.createdAt,
  };});

  return cloneDemo(items);
}

export function getDemoRecentDashboardActivities() {
  const snapshot = readSnapshot();
  const items: RecentDashboardActivity[] = snapshot.auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    relatedDocumentId: log.relatedDocumentId,
    relatedVersionId: log.relatedVersionId,
    relatedDocumentTitle: log.relatedDocumentId ? snapshot.documentDetails[log.relatedDocumentId]?.title ?? null : null,
    actorDisplayName: log.actorDisplayName,
    actorUsername: log.actorUsername,
    timestamp: log.timestamp,
  }));

  return cloneDemo(items);
}

export function getDemoSearchResults(filters: SearchFilters, language: Language = 'th'): SearchDocumentsResponse {
  const snapshot = readSnapshot();
  const query = filters.query.trim().toLowerCase();
  const category = filters.category.trim().toLowerCase();
  const status = filters.status.trim().toLowerCase();
  const owner = filters.owner.trim().toLowerCase();
  const controller = filters.controller.trim().toLowerCase();
  const signer = filters.signer.trim().toLowerCase();
  const archived = filters.archived.trim().toLowerCase();

  const filtered = snapshot.documentSummaries
    .map((document) => toDemoSearchItem(snapshot, localizeDocumentSummary(document, language)))
    .filter((document) => {
      const matchesQuery =
        !query ||
        document.title.toLowerCase().includes(query) ||
        (document.description ?? '').toLowerCase().includes(query) ||
        (document.category ?? '').toLowerCase().includes(query);
      const matchesCategory = !category || (document.category ?? '').toLowerCase().includes(category);
      const matchesStatus = !status || document.status.toLowerCase() === status;
      const matchesOwner = !owner || (document.ownerDisplayName ?? '').toLowerCase().includes(owner);
      const matchesController = !controller || (document.controllerDisplayName ?? '').toLowerCase().includes(controller);
      const matchesSigner =
        !signer ||
        (snapshot.signatures[document.id] ?? []).some((request) =>
          request.signerDisplayName.toLowerCase().includes(signer)
          || request.signerUsername.toLowerCase().includes(signer),
        );
      const matchesArchived =
        !archived
        || (archived === 'true' && document.status === 'Archived')
        || (archived === 'false' && document.status !== 'Archived');

      return matchesQuery && matchesCategory && matchesStatus && matchesOwner && matchesController && matchesSigner && matchesArchived;
    });

  const page = Math.max(1, filters.page);
  const pageSize = Math.max(1, filters.pageSize);
  const startIndex = (page - 1) * pageSize;

  return {
    items: cloneDemo(filtered.slice(startIndex, startIndex + pageSize)),
    page,
    pageSize,
    totalCount: filtered.length,
  };
}

export function getDemoAuditLogs(filters: AuditLogFilters, _language: Language = 'th'): AuditLogListResponse {
  const snapshot = readSnapshot();
  const actor = filters.actor.trim().toLowerCase();
  const action = filters.action.trim().toLowerCase();
  const documentId = filters.documentId.trim().toLowerCase();
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;

  const filtered = snapshot.auditLogs.filter((item) => {
    const timestamp = new Date(item.timestamp);
    const matchesActor =
      !actor ||
      (item.actorDisplayName ?? '').toLowerCase().includes(actor) ||
      (item.actorUsername ?? '').toLowerCase().includes(actor);
    const matchesAction = !action || item.action.toLowerCase().includes(action);
    const matchesDocument = !documentId || (item.relatedDocumentId ?? '').toLowerCase().includes(documentId);
    const matchesFrom = !from || timestamp >= from;
    const matchesTo = !to || timestamp <= to;

    return matchesActor && matchesAction && matchesDocument && matchesFrom && matchesTo;
  });

  const page = Math.max(1, filters.page);
  const pageSize = Math.max(1, filters.pageSize);
  const startIndex = (page - 1) * pageSize;

  return {
    items: cloneDemo(filtered.slice(startIndex, startIndex + pageSize).map(({ metadataJson: _metadataJson, ...item }) => item)),
    page,
    pageSize,
    totalCount: filtered.length,
  };
}

export function getDemoAuditLog(id: string, _language: Language = 'th') {
  const auditLog = readSnapshot().auditLogs.find((item) => item.id === id);
  return auditLog ? cloneDemo(auditLog) : null;
}

export function demoUpdateDocumentMetadata(id: string, input: UpdateDocumentInput, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];

    if (!detail) {
      return;
    }

    const nextStatus = detail.status === 'Approved' || detail.status === 'InReview' ? 'Draft' : detail.status;

    snapshot.documentDetails[id] = {
      ...detail,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      ownerUserId: input.ownerUserId ?? null,
      controllerUserId: input.controllerUserId ?? null,
      status: nextStatus,
      updatedAt: nowIso(),
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.metadata.updated',
      entityType: 'Document',
      entityId: id,
      relatedDocumentId: id,
      relatedVersionId: (snapshot.versions[id] ?? []).find((item) => item.isCurrent)?.id ?? null,
      metadata: { status: nextStatus, title: input.title, category: input.category ?? null },
    });
  });
}

export function demoCreateDocumentVersion(id: string, input: CreateVersionInput, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];
    const versions = snapshot.versions[id] ?? [];

    if (!detail) {
      return;
    }

    const nextVersionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
    const versionId = `${id}-demo-v${nextVersionNumber}`;
    const createdAt = nowIso();

    snapshot.versions[id] = [
      {
        id: versionId,
        documentId: id,
        versionNumber: nextVersionNumber,
        isCurrent: true,
        hasOriginalPdf: true,
        hasSignedPdf: Boolean(input.signedPdf),
        checksum: `sha256:demo-${nextVersionNumber}-${Date.now()}`,
        changeSummary: input.changeSummary,
        createdBy: actor?.username ?? 'demo.user',
        createdAt,
      },
      ...versions.map((version) => ({ ...version, isCurrent: false })),
    ];

    snapshot.documentDetails[id] = {
      ...detail,
      currentVersionNumber: nextVersionNumber,
      versionCount: nextVersionNumber,
      status: 'Draft',
      updatedAt: createdAt,
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.version.created',
      entityType: 'DocumentVersion',
      entityId: versionId,
      relatedDocumentId: id,
      relatedVersionId: versionId,
      metadata: { versionNumber: nextVersionNumber, changeSummary: input.changeSummary },
    });
  });
}

export function demoRestoreDocumentVersion(id: string, versionId: string, sourceVersionNumber: number, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];
    const versions = snapshot.versions[id] ?? [];
    const target = versions.find((version) => version.id === versionId);

    if (!detail || !target) {
      return;
    }

    const nextVersionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
    const restoredId = `${id}-demo-restore-v${nextVersionNumber}`;
    const createdAt = nowIso();

    snapshot.versions[id] = [
      {
        ...target,
        id: restoredId,
        versionNumber: nextVersionNumber,
        isCurrent: true,
        changeSummary: `กู้คืนจาก v${sourceVersionNumber} เพื่อสาธิต flow`,
        createdAt,
        createdBy: actor?.username ?? 'demo.user',
      },
      ...versions.map((version) => ({ ...version, isCurrent: false })),
    ];

    snapshot.documentDetails[id] = {
      ...detail,
      currentVersionNumber: nextVersionNumber,
      versionCount: nextVersionNumber,
      status: 'Draft',
      updatedAt: createdAt,
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.version.restored',
      entityType: 'DocumentVersion',
      entityId: restoredId,
      relatedDocumentId: id,
      relatedVersionId: restoredId,
      metadata: { restoredFromVersion: sourceVersionNumber },
    });
  });
}

export function demoSubmitReview(id: string, comment: string, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];

    if (!detail) {
      return;
    }

    const performedAt = nowIso();
    snapshot.documentDetails[id] = {
      ...detail,
      status: 'InReview',
      updatedAt: performedAt,
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    snapshot.approvalHistory[id] = [
      {
        id: createId('approval-demo-submit'),
        documentId: id,
        action: 'Submitted',
        fromStatus: detail.status,
        toStatus: 'InReview',
        performedBy: actor?.displayName ?? actor?.username ?? 'Current User',
        performedAt,
        comments: comment
          ? [{
            id: createId('approval-comment'),
            commentText: comment,
            createdBy: actor?.displayName ?? actor?.username ?? 'Current User',
            createdAt: performedAt,
          }]
          : [],
      },
      ...(snapshot.approvalHistory[id] ?? []),
    ];
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.approval.submitted',
      entityType: 'Document',
      entityId: id,
      relatedDocumentId: id,
      relatedVersionId: (snapshot.versions[id] ?? []).find((item) => item.isCurrent)?.id ?? null,
      metadata: { comment, status: 'InReview' },
    });
  });
}

export function demoApproveDocument(id: string, comment: string, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];
    if (!detail) return;
    const performedAt = nowIso();
    snapshot.documentDetails[id] = {
      ...detail,
      status: 'Approved',
      updatedAt: performedAt,
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    snapshot.approvalHistory[id] = [
      {
        id: createId('approval-demo-approve'),
        documentId: id,
        action: 'Approved',
        fromStatus: detail.status,
        toStatus: 'Approved',
        performedBy: actor?.displayName ?? actor?.username ?? 'Current User',
        performedAt,
        comments: comment
          ? [{
            id: createId('approval-comment'),
            commentText: comment,
            createdBy: actor?.displayName ?? actor?.username ?? 'Current User',
            createdAt: performedAt,
          }]
          : [],
      },
      ...(snapshot.approvalHistory[id] ?? []),
    ];
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.approval.approved',
      entityType: 'Document',
      entityId: id,
      relatedDocumentId: id,
      relatedVersionId: (snapshot.versions[id] ?? []).find((item) => item.isCurrent)?.id ?? null,
      metadata: { comment, status: 'Approved' },
    });
  });
}

export function demoRejectDocument(id: string, comment: string, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const detail = snapshot.documentDetails[id];
    if (!detail) return;
    const performedAt = nowIso();
    snapshot.documentDetails[id] = {
      ...detail,
      status: 'Rejected',
      updatedAt: performedAt,
      updatedBy: actor?.username ?? 'demo.user',
    };
    syncDocumentSummary(snapshot, id);
    snapshot.approvalHistory[id] = [
      {
        id: createId('approval-demo-reject'),
        documentId: id,
        action: 'Rejected',
        fromStatus: detail.status,
        toStatus: 'Rejected',
        performedBy: actor?.displayName ?? actor?.username ?? 'Current User',
        performedAt,
        comments: comment
          ? [{
            id: createId('approval-comment'),
            commentText: comment,
            createdBy: actor?.displayName ?? actor?.username ?? 'Current User',
            createdAt: performedAt,
          }]
          : [],
      },
      ...(snapshot.approvalHistory[id] ?? []),
    ];
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.approval.rejected',
      entityType: 'Document',
      entityId: id,
      relatedDocumentId: id,
      relatedVersionId: (snapshot.versions[id] ?? []).find((item) => item.isCurrent)?.id ?? null,
      metadata: { comment, status: 'Rejected' },
    });
  });
}

export function demoAssignSignature(id: string, input: AssignDocumentSignatureInput, actor: DemoActor | null | undefined) {
  updateSnapshot((snapshot) => {
    const signer = snapshot.users.find((user) => user.id === input.signerUserId);
    const currentVersion = (snapshot.versions[id] ?? []).find((item) => item.isCurrent);
    if (!signer || !currentVersion) return;

    const request: DocumentSignatureRequest = {
      id: createId('signature-demo'),
      documentId: id,
      documentVersionId: currentVersion.id,
      signerUserId: signer.id,
      signerUsername: signer.username,
      signerDisplayName: signer.displayName,
      signingOrder: input.signingOrder,
      status: 'Pending',
      pageNumber: input.pageNumber,
      positionX: input.positionX,
      positionY: input.positionY,
      width: input.width,
      height: input.height,
      signedAt: null,
      comment: input.comment ?? null,
      isForCurrentVersion: true,
      actions: [
        {
          id: createId('signature-action'),
          actionType: 'Assigned',
          performedBy: actor?.displayName ?? actor?.username ?? 'Current User',
          performedAt: nowIso(),
          comment: input.comment ?? null,
          outputObjectKey: null,
        },
      ],
    };

    snapshot.signatures[id] = [...(snapshot.signatures[id] ?? []), request].sort((left, right) => left.signingOrder - right.signingOrder);
    appendAuditLog(snapshot, {
      actorUserId: actor?.id,
      actorUsername: actor?.username,
      actorDisplayName: actor?.displayName,
      action: 'document.signer.assigned',
      entityType: 'DocumentSignatureRequest',
      entityId: request.id,
      relatedDocumentId: id,
      relatedVersionId: currentVersion.id,
      metadata: { signer: signer.displayName, signingOrder: input.signingOrder, pageNumber: input.pageNumber },
    });
  });
}

export function demoSignSignature(documentId: string, signatureRequestId: string, comment: string, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const requests = snapshot.signatures[documentId] ?? [];
    const index = requests.findIndex((item) => item.id === signatureRequestId);
    if (index < 0) return;

    const signedAt = nowIso();
    requests[index] = {
      ...requests[index],
      status: 'Signed',
      signedAt,
      comment: comment || requests[index].comment,
      actions: [
        ...(requests[index].actions ?? []),
        {
          id: createId('signature-action-signed'),
          actionType: 'Signed',
          performedBy: actor?.displayName ?? actor?.username ?? requests[index].signerDisplayName,
          performedAt: signedAt,
          comment: comment || null,
          outputObjectKey: `minio://${documentId}/${requests[index].documentVersionId}/signed-${requests[index].signingOrder}.pdf`,
        },
      ],
    };
    appendAuditLog(snapshot, {
      actorUserId: actor?.id ?? requests[index].signerUserId,
      actorUsername: actor?.username ?? requests[index].signerUsername,
      actorDisplayName: actor?.displayName ?? requests[index].signerDisplayName,
      action: 'document.signature.signed',
      entityType: 'DocumentSignatureRequest',
      entityId: signatureRequestId,
      relatedDocumentId: documentId,
      relatedVersionId: requests[index].documentVersionId,
      metadata: { signingOrder: requests[index].signingOrder, comment: comment || null },
    });
  });
}

export function demoRejectSignature(documentId: string, signatureRequestId: string, comment: string, actor?: DemoActor | null) {
  updateSnapshot((snapshot) => {
    const requests = snapshot.signatures[documentId] ?? [];
    const index = requests.findIndex((item) => item.id === signatureRequestId);
    if (index < 0) return;

    requests[index] = {
      ...requests[index],
      status: 'Rejected',
      comment: comment || requests[index].comment,
      actions: [
        ...(requests[index].actions ?? []),
        {
          id: createId('signature-action-rejected'),
          actionType: 'Rejected',
          performedBy: actor?.displayName ?? actor?.username ?? requests[index].signerDisplayName,
          performedAt: nowIso(),
          comment: comment || null,
          outputObjectKey: null,
        },
      ],
    };
    appendAuditLog(snapshot, {
      actorUserId: actor?.id ?? requests[index].signerUserId,
      actorUsername: actor?.username ?? requests[index].signerUsername,
      actorDisplayName: actor?.displayName ?? requests[index].signerDisplayName,
      action: 'document.signature.rejected',
      entityType: 'DocumentSignatureRequest',
      entityId: signatureRequestId,
      relatedDocumentId: documentId,
      relatedVersionId: requests[index].documentVersionId,
      metadata: { signingOrder: requests[index].signingOrder, comment: comment || null },
    });
  });
}

export function getDemoUsers() {
  return cloneDemo(readSnapshot().users);
}

export function getDemoUser(id: string) {
  return cloneDemo(readSnapshot().users.find((user) => user.id === id) ?? null);
}

export function demoCreateUser(input: any) {
  let created: AppUser | null = null;
  updateSnapshot((snapshot) => {
    const id = createId('demo-user');
    created = {
      id,
      username: input.username,
      email: input.email,
      displayName: `${input.firstName} ${input.lastName}`.trim() || input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      status: 'Active',
      createdAt: nowIso(),
      approvedAt: nowIso(),
      approvedBy: 'demo.admin',
      roles: input.roles,
    };
    snapshot.users.push(created);
    appendAuditLog(snapshot, {
      action: 'user.created',
      entityType: 'User',
      entityId: id,
      metadata: { username: input.username, roles: input.roles },
    });
  });
  return created as unknown as AppUser;
}

export function demoUpdateUser(id: string, input: any) {
  updateSnapshot((snapshot) => {
    const index = snapshot.users.findIndex((user) => user.id === id);
    if (index < 0) return;

    snapshot.users[index] = {
      ...snapshot.users[index],
      username: input.username,
      email: input.email,
      displayName: `${input.firstName} ${input.lastName}`.trim() || input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: input.roles,
    };

    appendAuditLog(snapshot, {
      action: 'user.updated',
      entityType: 'User',
      entityId: id,
      metadata: { roles: input.roles },
    });
  });
}

export function demoDeleteUser(id: string) {
  updateSnapshot((snapshot) => {
    const index = snapshot.users.findIndex((user) => user.id === id);
    if (index < 0) return;
    snapshot.users.splice(index, 1);
    appendAuditLog(snapshot, {
      action: 'user.deleted',
      entityType: 'User',
      entityId: id,
    });
  });
}

export function demoEnableUser(id: string) {
  let updated: AppUser | null = null;
  updateSnapshot((snapshot) => {
    const index = snapshot.users.findIndex((user) => user.id === id);
    if (index < 0) return;
    snapshot.users[index].status = 'Active';
    updated = snapshot.users[index];
    appendAuditLog(snapshot, {
      action: 'user.enabled',
      entityType: 'User',
      entityId: id,
    });
  });
  return updated as unknown as AppUser;
}

export function demoDisableUser(id: string) {
  let updated: AppUser | null = null;
  updateSnapshot((snapshot) => {
    const index = snapshot.users.findIndex((user) => user.id === id);
    if (index < 0) return;
    snapshot.users[index].status = 'Disabled';
    updated = snapshot.users[index];
    appendAuditLog(snapshot, {
      action: 'user.disabled',
      entityType: 'User',
      entityId: id,
    });
  });
  return updated as unknown as AppUser;
}

export function getDemoPasswordResetRequests() {
  return cloneDemo(readSnapshot().passwordResetRequests);
}

export function demoApprovePasswordResetRequest(id: string, comment: string) {
  let updated: PasswordResetRequest | null = null;
  updateSnapshot((snapshot) => {
    const index = snapshot.passwordResetRequests.findIndex((r) => r.id === id);
    if (index < 0) return;

    const request = snapshot.passwordResetRequests[index];
    const resetToken = `demo-token-${Date.now()}`;
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    request.status = 'Approved';
    request.reviewComment = comment;
    request.reviewedAt = nowIso();
    request.reviewedBy = 'demo.admin';
    request.resetUrl = resetUrl;
    request.resetTokenExpiresAt = new Date(Date.now() + 3600000).toISOString();

    updated = cloneDemo(request);

    appendAuditLog(snapshot, {
      action: 'user.password-reset.approved',
      entityType: 'PasswordResetRequest',
      entityId: id,
      metadata: { comment, resetUrl },
    });
  });
  return updated as unknown as PasswordResetRequest;
}

export function demoRejectPasswordResetRequest(id: string, comment: string) {
  let updated: PasswordResetRequest | null = null;
  updateSnapshot((snapshot) => {
    const index = snapshot.passwordResetRequests.findIndex((r) => r.id === id);
    if (index < 0) return;

    const request = snapshot.passwordResetRequests[index];
    request.status = 'Rejected';
    request.reviewComment = comment;
    request.reviewedAt = nowIso();
    request.reviewedBy = 'demo.admin';

    updated = cloneDemo(request);

    appendAuditLog(snapshot, {
      action: 'user.password-reset.rejected',
      entityType: 'PasswordResetRequest',
      entityId: id,
      metadata: { comment },
    });
  });
  return updated as unknown as PasswordResetRequest;
}
