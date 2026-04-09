import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
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

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
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

  const canManageVersions = user?.roles.some((role) => ['Admin', 'DocumentController', 'Manager', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;
  const canSubmitReview = user?.roles.some((role) => ['Admin', 'DocumentController', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;
  const canManageSignatures = user?.roles.some((role) => ['Admin', 'DocumentController', 'Manager', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role)) ?? false;

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
          canManageSignatures ? getAssignableSigners(accessToken) : Promise.resolve([]),
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
  }, [accessToken, canManageSignatures, id]);

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
      canManageSignatures ? getAssignableSigners(accessToken) : Promise.resolve([]),
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

    if (!id || !accessToken) {
      return;
    }

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

    if (!id || !accessToken || !versionInput) {
      return;
    }

    try {
      await createDocumentVersion(id, versionInput, accessToken);
      await refresh();
      setVersionInput(null);
      setNotice('New version uploaded successfully. Document is now Draft.');
      setError(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to create version.');
      setNotice(null);
    }
  }

  async function handleRestore(versionId: string, versionNumber: number) {
    if (!id || !accessToken) {
      return;
    }

    try {
      await restoreDocumentVersion(id, versionId, accessToken);
      await refresh();
      setNotice(`Version ${versionNumber} restored as the new current version and moved back to Draft.`);
      setError(null);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore version.');
      setNotice(null);
    }
  }

  async function handleSubmitReview() {
    if (!id || !accessToken) {
      return;
    }

    try {
      await submitDocumentForReview(id, { comment: reviewComment }, accessToken);
      await refresh();
      setReviewComment('');
      setNotice('Document submitted for manager review.');
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit review.');
      setNotice(null);
    }
  }

  async function handleAssignSigner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id || !accessToken) {
      return;
    }

    try {
      await assignDocumentSignature(id, signatureForm, accessToken);
      await refresh();
      setNotice('Signature request assigned.');
      setError(null);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign signature request.');
      setNotice(null);
    }
  }

  if (!document || !accessToken || !id) {
    return (
      <section className="panel">
        <p className="muted">{error ?? 'Loading document...'}</p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div className="actions">
        <Link className="button button--secondary" to="/documents">Back to documents</Link>
      </div>

      <div>
        <span className="sidebar__eyebrow">Document Detail</span>
        <h2>{document.title}</h2>
        <p className="muted">
          Status: {document.status} | Current version: {document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'}
        </p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="hero-grid">
        <article className="card stack">
          <span className="card__label">Lifecycle</span>
          <div>Versions tracked: {document.versionCount}</div>
          <div>Current: {currentVersion ? `v${currentVersion.versionNumber}` : 'No current version'}</div>
          <div>Review status: {document.status}</div>
          <div>Category: {document.category ?? 'Uncategorized'}</div>
          <div>Signature requests: {signatures.length}</div>
          <div>Signed PDF: {currentVersion?.hasSignedPdf ? 'Available' : 'Not available'}</div>
          <div>Original PDF: {currentVersion?.hasOriginalPdf ? 'Available' : 'Not available'}</div>
        </article>

        <article className="card stack">
          <span className="card__label">Audit</span>
          <div>Created at: {new Date(document.createdAt).toLocaleString()}</div>
          <div>Updated at: {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : 'Not updated'}</div>
          <div>Updated by: {document.updatedBy ?? 'Not updated'}</div>
          <div>Owner: {document.ownerDisplayName ?? 'Unassigned'}</div>
          <div>Controller: {document.controllerDisplayName ?? 'Unassigned'}</div>
        </article>
      </div>

      {canManageVersions ? (
        <form className="form-grid" onSubmit={handleDocumentSave}>
          <input
            className="input"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            className="input textarea"
            value={form.description ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Category"
            value={form.category ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          />
          <button className="button" type="submit">Save Document Details</button>
        </form>
      ) : null}

      {canManageVersions ? (
        <form className="form-grid" onSubmit={handleCreateVersion}>
          <input
            className="input"
            placeholder="Change summary"
            onChange={(event) => setVersionInput((current) => ({
              changeSummary: event.target.value,
              originalPdf: current?.originalPdf ?? new File([], ''),
              signedPdf: current?.signedPdf ?? null,
            }))}
          />
          <input
            accept="application/pdf,.pdf"
            className="input"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) {
                return;
              }

              setVersionInput((current) => ({
                changeSummary: current?.changeSummary ?? '',
                originalPdf: file,
                signedPdf: current?.signedPdf ?? null,
              }));
            }}
          />
          <input
            accept="application/pdf,.pdf"
            className="input"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setVersionInput((current) => ({
                changeSummary: current?.changeSummary ?? '',
                originalPdf: current?.originalPdf ?? new File([], ''),
                signedPdf: file,
              }));
            }}
          />
          <button className="button" disabled={!versionInput?.originalPdf || versionInput.originalPdf.size === 0 || !versionInput.changeSummary} type="submit">
            Upload New Version
          </button>
        </form>
      ) : null}

      {canSubmitReview && (document.status === 'Draft' || document.status === 'Rejected') ? (
        <div className="card stack">
          <span className="card__label">Submit Review</span>
          <textarea
            className="input textarea"
            placeholder="Optional review submission comment"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
          />
          <div className="actions">
            <button
              className="button"
              disabled={!currentVersion}
              type="button"
              onClick={() => void handleSubmitReview()}
            >
              Submit for Review
            </button>
          </div>
        </div>
      ) : null}

      {canManageSignatures ? (
        <form className="form-grid" onSubmit={handleAssignSigner}>
          <select
            className="input input--select"
            value={signatureForm.signerUserId}
            onChange={(event) => setSignatureForm((current) => ({ ...current, signerUserId: event.target.value }))}
          >
            <option value="">Select signer</option>
            {signers.map((signer) => (
              <option key={signer.id} value={signer.id}>
                {signer.displayName} ({signer.username})
              </option>
            ))}
          </select>
          <input className="input" type="number" min={1} value={signatureForm.signingOrder} onChange={(event) => setSignatureForm((current) => ({ ...current, signingOrder: Number(event.target.value) }))} />
          <input className="input" type="number" min={1} value={signatureForm.pageNumber} onChange={(event) => setSignatureForm((current) => ({ ...current, pageNumber: Number(event.target.value) }))} />
          <input className="input" type="number" min={0} step="0.01" value={signatureForm.positionX} onChange={(event) => setSignatureForm((current) => ({ ...current, positionX: Number(event.target.value) }))} />
          <input className="input" type="number" min={0} step="0.01" value={signatureForm.positionY} onChange={(event) => setSignatureForm((current) => ({ ...current, positionY: Number(event.target.value) }))} />
          <input className="input" type="number" min={1} step="0.01" value={signatureForm.width} onChange={(event) => setSignatureForm((current) => ({ ...current, width: Number(event.target.value) }))} />
          <input className="input" type="number" min={1} step="0.01" value={signatureForm.height} onChange={(event) => setSignatureForm((current) => ({ ...current, height: Number(event.target.value) }))} />
          <textarea
            className="input textarea"
            placeholder="Optional signature instruction"
            value={signatureForm.comment ?? ''}
            onChange={(event) => setSignatureForm((current) => ({ ...current, comment: event.target.value }))}
          />
          <button className="button" disabled={!signatureForm.signerUserId} type="submit">
            Assign Signer
          </button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Original PDF</th>
              <th>Signed PDF</th>
              <th>Change Summary</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.id}>
                <td>v{version.versionNumber}</td>
                <td>{version.isCurrent ? 'Current' : 'Historical'}</td>
                <td>{version.hasOriginalPdf ? 'Available' : 'Missing'}</td>
                <td>{version.hasSignedPdf ? 'Available' : 'Not available'}</td>
                <td>
                  <div>{version.changeSummary}</div>
                  <div className="muted checksum">{version.checksum}</div>
                </td>
                <td>
                  <div>{version.createdBy}</div>
                  <div className="muted">{new Date(version.createdAt).toLocaleString()}</div>
                </td>
                <td>
                  {canManageVersions && !version.isCurrent ? (
                    <button className="button button--secondary" type="button" onClick={() => void handleRestore(version.id, version.versionNumber)}>
                      Restore
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Signer</th>
              <th>Order</th>
              <th>Status</th>
              <th>Position</th>
              <th>Signed At</th>
              <th>History</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((signature) => (
              <tr key={signature.id}>
                <td>
                  <div>{signature.signerDisplayName}</div>
                  <div className="muted">{signature.signerUsername}</div>
                </td>
                <td>{signature.signingOrder}</td>
                <td>{signature.status}</td>
                <td>Page {signature.pageNumber} @ {signature.positionX}, {signature.positionY} ({signature.width} × {signature.height})</td>
                <td>{signature.signedAt ? new Date(signature.signedAt).toLocaleString() : 'Pending'}</td>
                <td>
                  {signature.actions.map((action) => (
                    <div key={action.id} className="comment-block">
                      <div>{action.actionType} by {action.performedBy}</div>
                      <div className="muted">{new Date(action.performedAt).toLocaleString()}</div>
                      {action.comment ? <div>{action.comment}</div> : null}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {signatures.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">No signature requests configured.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Transition</th>
              <th>Performed By</th>
              <th>Time</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {approvalHistory.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{entry.fromStatus} → {entry.toStatus}</td>
                <td>{entry.performedBy}</td>
                <td>{new Date(entry.performedAt).toLocaleString()}</td>
                <td>
                  {entry.comments.length > 0 ? entry.comments.map((comment) => (
                    <div key={comment.id} className="comment-block">
                      <div>{comment.commentText}</div>
                      <div className="muted">{comment.createdBy} • {new Date(comment.createdAt).toLocaleString()}</div>
                    </div>
                  )) : <span className="muted">No comments</span>}
                </td>
              </tr>
            ))}
            {approvalHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">No approval history recorded yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
