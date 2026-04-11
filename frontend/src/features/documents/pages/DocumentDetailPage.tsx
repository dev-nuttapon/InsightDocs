import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
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

import { DocumentDetailsTab } from '../components/DocumentDetailsTab';
import { DocumentVersionsTab } from '../components/DocumentVersionsTab';
import { DocumentSignaturesTab } from '../components/DocumentSignaturesTab';
import { DocumentHistoryTab } from '../components/DocumentHistoryTab';

type TabType = 'details' | 'versions' | 'signatures' | 'history';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const access = buildAccessProfile(user?.roles ?? []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!id || !accessToken) {
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
  }, [access.canManageSignatures, accessToken, id]);

  const currentVersion = useMemo(
    () => versions.find((version) => version.isCurrent) ?? null,
    [versions],
  );

  async function refresh() {
    if (!id || !accessToken) {
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
  }

  async function handleDocumentSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !accessToken) return;
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
    if (!id || !accessToken || !versionInput) return;
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
    if (!id || !accessToken) return;
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
    if (!id || !accessToken) return;
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
    if (!id || !accessToken) return;
    try {
      await assignDocumentSignature(id, signatureForm, accessToken);
      await refresh();
      setNotice('Signature request assigned.');
      setError(null);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign signer.');
    }
  }

  if (!document || !accessToken || !id) {
    return (
      <StatePanel eyebrow="Document Detail" title="Loading document" description="Fetching detailed metadata and compliance history." busy />
    );
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title={document.title}
        eyebrow="Document Detail"
        description={document.description || "Governed enterprise document."}
        actions={
          <div className="actions">
            <Link className="button button--secondary" to="/documents">← Back to registry</Link>
          </div>
        }
      />

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="dashboard-summary-grid">
        <StatCard label="Review Status" value={document.status} icon={<StatusBadge status={document.status} />} />
        <StatCard label="Current Version" value={document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'} />
        <StatCard label="Signers Assigned" value={signatures.length} />
        <StatCard label="Version History" value={document.versionCount} />
        <StatCard label="Category" value={document.category || 'Unset'} />
      </div>

      <nav className="tab-list">
        <button className={`tab-item ${activeTab === 'details' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`tab-item ${activeTab === 'versions' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('versions')}>Versions ({versions.length})</button>
        <button className={`tab-item ${activeTab === 'signatures' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('signatures')}>Signatures ({signatures.length})</button>
        <button className={`tab-item ${activeTab === 'history' ? 'tab-item--active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
      </nav>

      <div className="panel stack">
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
