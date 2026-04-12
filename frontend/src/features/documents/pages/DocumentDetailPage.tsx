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
import { DemoControlPanel } from '../../../shared/components/mock/DemoControlPanel';
import {
  getDemoScenarioState,
  getDemoShowcaseDocument,
} from '../../../shared/mock/demoScenario';

import { DocumentDetailsTab } from '../components/DocumentDetailsTab';
import { DocumentVersionsTab } from '../components/DocumentVersionsTab';
import { DocumentSignaturesTab } from '../components/DocumentSignaturesTab';
import { DocumentHistoryTab } from '../components/DocumentHistoryTab';
import { DocumentEvidenceRail } from '../components/DocumentEvidenceRail';
import { useTranslation } from '../../../i18n/useTranslation';

type TabType = 'details' | 'versions' | 'signatures' | 'history';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const { language, t } = useTranslation();
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
        const detail = getDemoDocumentDetail(id, language);

        if (!ignore) {
          if (!detail) {
            setError(t('documents.demoDocumentNotFound'));
            return;
          }

          const versionHistory = getDemoDocumentVersions(id, language);
          const history = getDemoApprovalHistory(id, language);
          const signatureHistory = getDemoDocumentSignatures(id, language);
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
          setError(loadError instanceof Error ? loadError.message : t('common.loadingDocumentDescription'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [access.canManageSignatures, accessToken, demoMode, id, language, t]);

  const currentVersion = useMemo(
    () => versions.find((version) => version.isCurrent) ?? null,
    [versions],
  );
  const showcaseDocument = id ? getDemoShowcaseDocument(id, language) : null;
  const scenarioState = getDemoScenarioState(id, language);
  const workflowStats = useMemo(() => {
    const totalSigned = signatures.filter((signature) => signature.status === 'Signed').length;
    const totalPending = signatures.filter((signature) => signature.status === 'Pending').length;

    return [
      { label: t('documents.currentStatus'), value: document?.status ?? '-' },
      { label: t('documents.currentVersion'), value: document?.currentVersionNumber ? `v${document.currentVersionNumber}` : t('documents.none') },
      { label: t('documents.assignedSigners'), value: signatures.length },
      { label: t('documents.signedCount'), value: totalSigned },
      { label: t('documents.pendingCount'), value: totalPending },
    ];
  }, [document, signatures, t]);
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
      const detail = getDemoDocumentDetail(id, language);

      if (!detail) {
        setError(t('documents.demoDocumentNotFound'));
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
      setVersions(getDemoDocumentVersions(id, language));
      setApprovalHistory(getDemoApprovalHistory(id, language));
      setSignatures(getDemoDocumentSignatures(id, language));
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
      setNotice(t('documents.updatedDemo'));
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      const updated = await updateDocument(id, form, accessToken);
      setDocument(updated);
      setNotice(t('documents.updatedLive'));
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('documents.updateError'));
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
      setNotice(t('documents.versionUploadedDemo'));
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await createDocumentVersion(id, versionInput, accessToken);
      await refresh();
      setVersionInput(null);
      setNotice(t('documents.versionUploadedLive'));
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('documents.versionCreateError'));
    }
  }

  async function handleRestore(versionId: string, versionNumber: number) {
    if (!id) return;

    if (demoMode && document) {
      if (!versions.find((version) => version.id === versionId)) {
        setError(t('documents.demoVersionNotFound'));
        return;
      }
      demoRestoreDocumentVersion(id, versionId, versionNumber, user ?? null);
      await refresh();
      setNotice(t('documents.versionRestoredDemo', { version: versionNumber }));
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await restoreDocumentVersion(id, versionId, accessToken);
      await refresh();
      setNotice(t('documents.versionRestoredLive', { version: versionNumber }));
      setError(null);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : t('documents.versionRestoreError'));
    }
  }

  async function handleSubmitReview() {
    if (!id) return;

    if (demoMode && document) {
      demoSubmitReview(id, reviewComment, user ?? null);
      await refresh();
      setReviewComment('');
      setNotice(t('documents.submittedReviewDemo'));
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await submitDocumentForReview(id, { comment: reviewComment }, accessToken);
      await refresh();
      setReviewComment('');
      setNotice(t('documents.submittedReviewLive'));
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('documents.submitReviewError'));
    }
  }

  async function handleAssignSigner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    if (demoMode) {
      if (!signers.find((signer) => signer.id === signatureForm.signerUserId)) {
        setError(t('documents.selectDemoSigner'));
        return;
      }
      demoAssignSignature(id, signatureForm, user ?? null);
      await refresh();
      setNotice(t('documents.assignedSignerDemo'));
      setError(null);
      return;
    }

    if (!accessToken) return;
    try {
      await assignDocumentSignature(id, signatureForm, accessToken);
      await refresh();
      setNotice(t('documents.assignedSignerLive'));
      setError(null);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : t('documents.assignSignerError'));
    }
  }

  if (!document || !id || (!demoMode && !accessToken)) {
    return (
      <StatePanel eyebrow={t('documents.detailEyebrow')} title={t('common.loadingDocumentTitle')} description={t('common.loadingDocumentDescription')} busy />
    );
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title={document.title}
        eyebrow={t('documents.detailEyebrow')}
        description={document.description || t('documents.governedDescription')}
        actions={
          <div className="actions">
            <Link className="button button--secondary" to="/documents">{t('common.backToRegistry')}</Link>
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
              {document.description || t('documents.governedDescription')}
            </p>
            <div className="document-flagship__meta">
              <span>{t('documents.categoryMeta', { value: document.category || t('documents.unspecified') })}</span>
              <span>{t('documents.ownerMeta', { value: document.ownerDisplayName || t('documents.unassigned') })}</span>
              <span>{t('documents.controllerMeta', { value: document.controllerDisplayName || t('documents.unassigned') })}</span>
              <span>{t('documents.versionMeta', { value: document.currentVersionNumber ? `v${document.currentVersionNumber}` : t('documents.none') })}</span>
            </div>
            <div className="document-flagship__cta">
              {scenarioState.primaryAction.to !== `/documents/${id}` ? (
                <Link className="button" to={scenarioState.primaryAction.to}>{scenarioState.primaryAction.label}</Link>
              ) : null}
              {showcaseDocument ? (
                <a
                  className="button button--secondary"
                  href={showcaseDocument.pdfPath}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('demo.openSamplePdf')}
                </a>
              ) : null}
              <Link className="button button--secondary" to="/audit-logs">{t('documents.openAudit')}</Link>
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
                    {t('documents.pageLabel', { page })}
                  </button>
                ))}
              </div>
              <span className="muted">{t('documents.previewLabel')}</span>
            </div>
            <div className="document-preview__sheet">
              <div className="document-preview__header">
                <strong>{document.title}</strong>
                <span>{document.category || t('documents.documentLabel')} • {t('documents.pageLabel', { page: previewPage })}</span>
              </div>
              <div className="document-preview__body">
                <div className="document-preview__line document-preview__line--short" />
                <div className="document-preview__line" />
                <div className="document-preview__line" />
                <div className="document-preview__line document-preview__line--short" />
                {previewSignatures.length === 0 ? (
                  <div className="document-preview__empty">
                    <strong>{t('documents.noSignaturesOnPage')}</strong>
                    <span>{t('documents.noSignaturesOnPageDescription')}</span>
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
                    <small>{t('signatures.orderLabel', { order: signature.signingOrder })}</small>
                  </div>
                ))}
              </div>
              <div className="document-preview__footer">
                <span>{t('documents.visibleBlocks')}</span>
                <span>{t('documents.blocksOnPage', { count: previewSignatures.length, total: signatures.length })}</span>
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
          secondaryAction={{ label: t('common.backToRegistry'), to: '/documents' }}
        />
      </section>

      <section className="workflow-ribbon">
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">{t('documents.currentStep')}</span>
          <strong>{scenarioState.badge}</strong>
          <p className="muted">{scenarioState.headline}</p>
        </div>
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">{t('documents.versionContext')}</span>
          <strong>{currentVersion ? `v${currentVersion.versionNumber}` : t('documents.noVersion')}</strong>
          <p className="muted">{currentVersion?.changeSummary ?? t('documents.noVersionContext')}</p>
        </div>
        <div className="workflow-ribbon__card">
          <span className="sidebar__eyebrow">{t('documents.nextStep')}</span>
          <strong>{scenarioState.focus}</strong>
          <p className="muted">{scenarioState.nextStep}</p>
        </div>
      </section>

      <DocumentEvidenceRail
        document={document}
        versions={versions}
        approvalHistory={approvalHistory}
        signatures={signatures}
      />

      {demoMode ? <DemoControlPanel compact currentDocumentId={id} /> : null}

      <ModuleMockup
        eyebrow={t('documents.storyEyebrow')}
        title={t('documents.storyTitle')}
        description={t('documents.storyDescription')}
        highlights={t('documents.storyHighlights').split('|||')}
        steps={t('documents.storySteps').split('|||')}
        metrics={[
          { label: t('documents.demoModeMetric'), value: demoMode ? t('documents.demoModeEnabled') : t('documents.demoModeLive') },
          { label: t('documents.pdfPreviewMetric'), value: showcaseDocument ? t('documents.pdfPreviewVisible') : t('documents.pdfPreviewMetadata') },
        ]}
      />

      <nav className="tab-list">
        <button className={`tab-item ${activeTab === 'details' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('details')}>{t('documents.detailsTab')}</button>
        <button className={`tab-item ${activeTab === 'versions' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('versions')}>{t('documents.versionsTab')} ({versions.length})</button>
        <button className={`tab-item ${activeTab === 'signatures' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('signatures')}>{t('documents.signaturesTab')} ({signatures.length})</button>
        <button className={`tab-item ${activeTab === 'history' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('history')}>{t('documents.historyTab')}</button>
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
