import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import {
  demoAssignSignature,
  demoCreateDocumentVersion,
  demoRestoreDocumentVersion,
  demoSubmitReview,
  demoUpdateDocumentMetadata,
  getDemoApprovalHistory,
  getDemoAssignableSigners,
  getDemoDocumentDetail,
  getDemoDocumentSignatures,
  getDemoDocumentVersions,
} from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import {
  assignDocumentSignature,
  createDocumentVersion,
  getApprovalHistory,
  getAssignableSigners,
  getDocument,
  getDocumentSignatures,
  getDocumentVersions,
  restoreDocumentVersion,
  submitDocumentForReview,
  updateDocument,
} from '../api/documentsApi';

import type {
  AssignDocumentSignatureInput,
  CreateVersionInput,
  DocumentApprovalHistoryItem,
  DocumentDetail,
  DocumentSignatureRequest,
  DocumentVersion,
  UpdateDocumentInput,
} from '../types';
import type { AppUser } from '../../users/types';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { StatePanel } from '../../../shared/components/state/StatePanel';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import {
  getDemoScenarioState,
  getDemoShowcaseDocument,
} from '../../../shared/mock/demoScenario';

import { DocumentDetailsTab } from '../components/DocumentDetailsTab';
import { DocumentVersionsTab } from '../components/DocumentVersionsTab';
import { DocumentSignaturesTab } from '../components/DocumentSignaturesTab';
import { DocumentHistoryTab } from '../components/DocumentHistoryTab';

type TabType = 'details' | 'versions' | 'signatures' | 'history';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const demoMode = isDemoModeEnabled();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<DocumentApprovalHistoryItem[]>([]);
  const [signatures, setSignatures] = useState<DocumentSignatureRequest[]>([]);
  const [signers, setSigners] = useState<AppUser[]>([]);
  const [form, setForm] = useState<UpdateDocumentInput>({ title: '', description: '', category: '' });
  const [versionInput, setVersionInput] = useState<CreateVersionInput | null>(null);
  const [signatureForm, setSignatureForm] = useState<AssignDocumentSignatureInput>({
    signerUserId: '',
    signingOrder: 1,
    pageNumber: 1,
    positionX: 48,
    positionY: 680,
    width: 180,
    height: 60,
    comment: '',
  });
  const [reviewComment, setReviewComment] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const access = buildAccessProfile(user?.roles ?? []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!id) {
        return;
      }

      if (demoMode) {
        const detail = getDemoDocumentDetail(id);

        if (!ignore) {
          if (!detail) {
            setError('ไม่พบเอกสารตัวอย่างที่ร้องขอ');
            return;
          }

          const versionHistory = getDemoDocumentVersions(id);
          const history = getDemoApprovalHistory(id);
          const signatureHistory = getDemoDocumentSignatures(id);
          const availableSigners = getDemoAssignableSigners();

          setDocument(detail);
          setForm({
            title: detail.title,
            description: detail.description ?? '',
            category: detail.category ?? '',
            ownerUserId: detail.ownerUserId,
            controllerUserId: detail.controllerUserId,
          });
          setVersions(versionHistory);
          setApprovalHistory(history);
          setSignatures(signatureHistory);
          setSigners(availableSigners);
          setSignatureForm((current) => ({
            ...current,
            signerUserId: current.signerUserId || availableSigners[0]?.id || '',
          }));
          setError(null);
        }
        return;
      }

      if (!accessToken) {
        return;
      }

      try {
        const [detail, versionHistory, history, signatureHistory, availableSigners] = await Promise.all([
          getDocument(id, accessToken),
          getDocumentVersions(id, accessToken),
          getApprovalHistory(id, accessToken),
          getDocumentSignatures(id, accessToken),
          access.canManageSignatures ? getAssignableSigners(accessToken) : Promise.resolve([]),
        ]);

        if (!ignore) {
          setDocument(detail);
          setForm({
            title: detail.title,
            description: detail.description ?? '',
            category: detail.category ?? '',
            ownerUserId: detail.ownerUserId,
            controllerUserId: detail.controllerUserId,
          });
          setVersions(versionHistory);
          setApprovalHistory(history);
          setSignatures(signatureHistory);
          setSigners(availableSigners);
          setSignatureForm((current) => ({
            ...current,
            signerUserId: current.signerUserId || availableSigners[0]?.id || '',
          }));
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load document.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [access.canManageSignatures, accessToken, demoMode, id]);

  const currentVersion = useMemo(
    () => versions.find((version) => version.isCurrent) ?? null,
    [versions],
  );
  const showcaseDocument = id ? getDemoShowcaseDocument(id) : null;
  const scenarioState = getDemoScenarioState(id);
  const workflowStats = useMemo(() => {
    const totalSigned = signatures.filter((signature) => signature.status === 'Signed').length;
    const totalPending = signatures.filter((signature) => signature.status === 'Pending').length;

    return [
      { label: 'Current Status', value: document?.status ?? '-' },
      { label: 'Current Version', value: document?.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None' },
      { label: 'Assigned Signers', value: signatures.length },
      { label: 'Signed', value: totalSigned },
      { label: 'Pending', value: totalPending },
    ];
  }, [document, signatures]);
  const previewPages = useMemo(() => {
    const pages = new Set<number>([1]);

    signatures.forEach((signature) => {
      pages.add(signature.pageNumber);
    });

    return Array.from(pages).sort((left, right) => left - right);
  }, [signatures]);
  const previewSignatures = useMemo(
    () => signatures.filter((signature) => signature.pageNumber === previewPage),
    [previewPage, signatures],
  );

  async function refresh() {
    if (!id) {
      return;
    }

    if (demoMode) {
      const detail = getDemoDocumentDetail(id);

      if (!detail) {
        setError('ไม่พบเอกสารตัวอย่างที่ร้องขอ');
        return;
      }

      setDocument(detail);
      setForm({
        title: detail.title,
        description: detail.description ?? '',
        category: detail.category ?? '',
        ownerUserId: detail.ownerUserId,
        controllerUserId: detail.controllerUserId,
      });
      setVersions(getDemoDocumentVersions(id));
      setApprovalHistory(getDemoApprovalHistory(id));
      setSignatures(getDemoDocumentSignatures(id));
      setSigners(getDemoAssignableSigners());
      setPreviewPage(1);
      return;
    }

    if (!accessToken) {
      return;
    }

    const [detail, versionHistory, history, signatureHistory, availableSigners] = await Promise.all([
      getDocument(id, accessToken),
      getDocumentVersions(id, accessToken),
      getApprovalHistory(id, accessToken),
      getDocumentSignatures(id, accessToken),
      access.canManageSignatures ? getAssignableSigners(accessToken) : Promise.resolve([]),
    ]);

    setDocument(detail);
    setForm({
      title: detail.title,
      description: detail.description ?? '',
      category: detail.category ?? '',
      ownerUserId: detail.ownerUserId,
      controllerUserId: detail.controllerUserId,
    });
    setVersions(versionHistory);
    setApprovalHistory(history);
    setSignatures(signatureHistory);
    setSigners(availableSigners);
    setPreviewPage(1);
  }

  async function handleDocumentSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    if (demoMode && document) {
      demoUpdateDocumentMetadata(id, form, user ?? null);
      await refresh();
      setNotice('อัปเดตข้อมูลเอกสารตัวอย่างแล้วในโหมด demo');
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      const updated = await updateDocument(id, form, accessToken);
      setDocument(updated);
      setNotice('Document details updated and returned to Draft.');
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update document.');
      setNotice(null);
    }
  }

  async function handleCreateVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !versionInput) return;

    if (demoMode && document) {
      demoCreateDocumentVersion(id, versionInput, user ?? null);
      await refresh();
      setVersionInput(null);
      setNotice('อัปโหลดเวอร์ชันตัวอย่างใหม่แล้วในโหมด demo');
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await createDocumentVersion(id, versionInput, accessToken);
      await refresh();
      setVersionInput(null);
      setNotice('New version uploaded successfully.');
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to create version.');
    }
  }

  async function handleRestore(versionId: string, versionNumber: number) {
    if (!id) return;

    if (demoMode && document) {
      if (!versions.find((version) => version.id === versionId)) {
        setError('ไม่พบเวอร์ชันตัวอย่างที่ต้องการกู้คืน');
        return;
      }
      demoRestoreDocumentVersion(id, versionId, versionNumber, user ?? null);
      await refresh();
      setNotice(`กู้คืนเวอร์ชันตัวอย่างจาก v${versionNumber} แล้วในโหมด demo`);
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await restoreDocumentVersion(id, versionId, accessToken);
      await refresh();
      setNotice(`Version ${versionNumber} restored.`);
      setError(null);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore version.');
    }
  }

  async function handleSubmitReview() {
    if (!id) return;

    if (demoMode && document) {
      demoSubmitReview(id, reviewComment, user ?? null);
      await refresh();
      setReviewComment('');
      setNotice('ส่งเอกสารตัวอย่างเข้าสู่ review แล้วในโหมด demo');
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await submitDocumentForReview(id, { comment: reviewComment }, accessToken);
      await refresh();
      setReviewComment('');
      setNotice('Document submitted for review.');
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit review.');
    }
  }

  async function handleAssignSigner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    if (demoMode) {
      if (!signers.find((signer) => signer.id === signatureForm.signerUserId)) {
        setError('กรุณาเลือกผู้ลงนามสำหรับ demo');
        return;
      }
      demoAssignSignature(id, signatureForm, user ?? null);
      await refresh();
      setNotice('กำหนดผู้ลงนามตัวอย่างแล้วในโหมด demo');
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await assignDocumentSignature(id, signatureForm, accessToken);
      await refresh();
      setNotice('Signature request assigned.');
      setError(null);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign signer.');
    }
  }

  if (!document || !id || (!demoMode && !accessToken)) {
    return (
      <StatePanel eyebrow="Document Detail" title="Loading document" description="Fetching detailed metadata and compliance history." busy />
    );
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title={document.title}
        eyebrow="Flagship Document Detail"
        description={document.description || 'Governed enterprise document.'}
        actions={
          <div className="actions">
            <Link className="button button--secondary" to="/documents">กลับไปทะเบียนเอกสาร</Link>
          </div>
        }
      />

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <section className="document-flagship">
        <div className="document-flagship__hero">
          <div className="document-flagship__copy">
            <div className="document-flagship__badges">
              <StatusBadge status={document.status} />
              {showcaseDocument ? <span className="status-pill status-pill--subtle">{showcaseDocument.nextAction}</span> : null}
            </div>
            <h2 className="document-flagship__title">{document.title}</h2>
            <p className="document-flagship__description">
              {document.description || 'เอกสารภายในที่ควบคุมครบทั้ง metadata, versioning, approval, signature และ audit trace'}
            </p>
            <div className="document-flagship__meta">
              <span>หมวดหมู่: {document.category || 'ไม่ระบุ'}</span>
              <span>Owner: {document.ownerDisplayName || 'Unassigned'}</span>
              <span>Controller: {document.controllerDisplayName || 'Unassigned'}</span>
              <span>Version: {document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'}</span>
            </div>
            <div className="document-flagship__cta">
              {scenarioState.primaryAction.to !== `/documents/${id}` ? (
                <Link className="button" to={scenarioState.primaryAction.to}>{scenarioState.primaryAction.label}</Link>
              ) : null}
              <Link className="button button--secondary" to="/audit-logs">เปิด Audit Log</Link>
            </div>
          </div>

          <div className="document-preview">
            <div className="document-preview__toolbar">
              <div className="tag-list">
                {previewPages.map((page) => (
                  <button
                    key={page}
                    className={`tag tag--button${previewPage === page ? ' tag--active' : ''}`}
                    type="button"
                    onClick={() => setPreviewPage(page)}
                  >
                    หน้า {page}
                  </button>
                ))}
              </div>
              <span className="muted">Visible signature preview</span>
            </div>
            <div className="document-preview__sheet">
              <div className="document-preview__header">
                <strong>{document.title}</strong>
                <span>{document.category || 'Document'} • หน้า {previewPage}</span>
              </div>
              <div className="document-preview__body">
                <div className="document-preview__line document-preview__line--short" />
                <div className="document-preview__line" />
                <div className="document-preview__line" />
                <div className="document-preview__line document-preview__line--short" />
                {previewSignatures.length === 0 ? (
                  <div className="document-preview__empty">
                    <strong>ยังไม่มีลายเซ็นในหน้าที่เลือก</strong>
                    <span>เลือกหน้าที่มีผู้ลงนาม หรือกำหนดผู้ลงนามเพิ่มในแท็บ Signatures</span>
                  </div>
                ) : null}
                {previewSignatures.map((signature, index) => (
                  <div
                    key={signature.id}
                    className={`document-preview__signature document-preview__signature--dynamic document-preview__signature--${signature.status.toLowerCase()}`}
                    style={{
                      left: `${Math.max(4, Math.min(72, signature.positionX / 9))}%`,
                      top: `${Math.max(24, Math.min(76, signature.positionY / 11))}%`,
                      width: `${Math.max(18, Math.min(26, signature.width / 10))}%`,
                      minHeight: `${Math.max(56, Math.min(96, signature.height * 1.1))}px`,
                      zIndex: 10 + index,
                    }}
                  >
                    <span>{signature.signerDisplayName}</span>
                    <small>Order {signature.signingOrder}</small>
                  </div>
                ))}
              </div>
              <div className="document-preview__footer">
                <span>Visible signature blocks</span>
                <span>{previewSignatures.length} บนหน้านี้ / {signatures.length} ทั้งหมด</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-summary-grid dashboard-summary-grid--hero">
          {workflowStats.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>

        <DemoScenarioPanel
          compact
          state={scenarioState}
          secondaryAction={{ label: 'กลับไปทะเบียนเอกสาร', to: '/documents' }}
        />
      </section>

      <section className="workflow-ribbon">
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">Current Step</span>
          <strong>{scenarioState.badge}</strong>
          <p className="muted">{scenarioState.headline}</p>
        </div>
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">Version Context</span>
          <strong>{currentVersion ? `v${currentVersion.versionNumber}` : 'No version'}</strong>
          <p className="muted">{currentVersion?.changeSummary ?? 'ยังไม่มีข้อมูลเวอร์ชันปัจจุบัน'}</p>
        </div>
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">Next Step</span>
          <strong>{scenarioState.focus}</strong>
          <p className="muted">{scenarioState.nextStep}</p>
        </div>
      </section>

      <ModuleMockup
        eyebrow="Document Story"
        title="หน้าหลักของระบบที่รวม version, approval, signature และ audit ไว้ในที่เดียว"
        description="ใช้หน้านี้เป็น centerpiece ของ demo เพื่อสลับดูแท็บต่าง ๆ และอธิบายความเชื่อมโยงของ workflow ทั้งระบบโดยไม่ต้องเปลี่ยนบริบทไปมาหลายหน้า"
        highlights={['Document Hero', 'PDF Preview', 'Workflow Timeline', 'Scenario CTA']}
        steps={[
          'เริ่มจาก document hero เพื่อดูสถานะและ next step ปัจจุบัน',
          'เปิดแท็บ versions, signatures และ history เพื่อเล่า workflow ต่อเนื่อง',
          'ใช้ CTA ด้านบนเพื่อกระโดดไปยัง approvals, signatures หรือ audit ตาม phase ของเอกสาร',
        ]}
        metrics={[
          { label: 'Demo Mode', value: demoMode ? 'Enabled' : 'Live Data' },
          { label: 'PDF Preview', value: showcaseDocument ? 'Visible Signature Mock' : 'Metadata View' },
        ]}
      />

      <nav className="tab-list">
        <button className={`tab-item ${activeTab === 'details' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`tab-item ${activeTab === 'versions' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('versions')}>Versions ({versions.length})</button>
        <button className={`tab-item ${activeTab === 'signatures' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('signatures')}>Signatures ({signatures.length})</button>
        <button className={`tab-item ${activeTab === 'history' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('history')}>Approval & Audit</button>
      </nav>

      <div className="panel panel--full stack">
        {activeTab === 'details' && (
          <DocumentDetailsTab
            document={document}
            form={form}
            canManage={access.canManageDocuments}
            onFormChange={(patch) => setForm(f => ({ ...f, ...patch }))}
            onSave={handleDocumentSave}
          />
        )}
        {activeTab === 'versions' && (
          <DocumentVersionsTab
            versions={versions}
            canManage={access.canManageDocuments}
            versionInput={versionInput}
            onVersionInputChange={(p) => setVersionInput(i => ({ ...i, ...p } as CreateVersionInput))}
            onUpload={handleCreateVersion}
            onRestore={handleRestore}
          />
        )}
        {activeTab === 'signatures' && (
          <DocumentSignaturesTab
            signatures={signatures}
            signers={signers}
            canManage={access.canManageSignatures}
            signatureForm={signatureForm}
            onFormChange={(p) => setSignatureForm(f => ({ ...f, ...p }))}
            onAssign={handleAssignSigner}
          />
        )}
        {activeTab === 'history' && (
          <DocumentHistoryTab
            document={document}
            history={approvalHistory}
            canSubmitReview={access.canSubmitReview}
            reviewComment={reviewComment}
            onReviewCommentChange={setReviewComment}
            onSubmitReview={handleSubmitReview}
            hasCurrentVersion={!!currentVersion}
          />
        )}
      </div>
    </section>
  );
}
