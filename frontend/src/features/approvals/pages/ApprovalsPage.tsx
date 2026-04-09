import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { approveDocument, getPendingApprovals, rejectDocument } from '../../documents/api/documentsApi';
import type { PendingApproval } from '../../documents/types';

export function ApprovalsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await getPendingApprovals(accessToken);
        if (!ignore) {
          setItems(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load pending approvals.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  async function runDecision(documentId: string, action: 'approve' | 'reject') {
    if (!accessToken) {
      return;
    }

    try {
      if (action === 'approve') {
        await approveDocument(documentId, { comment: comments[documentId] }, accessToken);
      } else {
        await rejectDocument(documentId, { comment: comments[documentId] }, accessToken);
      }

      const payload = await getPendingApprovals(accessToken);
      setItems(payload);
      setNotice(action === 'approve' ? 'Document approved.' : 'Document rejected.');
      setError(null);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Approval action failed.');
      setNotice(null);
    }
  }

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Approvals</span>
        <h2>Pending approval queue</h2>
        <p className="muted">Managers review documents that have been submitted by DocumentControllers.</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Current Version</th>
              <th>Submitted</th>
              <th>Comment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.documentId}>
                <td>
                  <Link to={`/documents/${item.documentId}`}>{item.documentTitle}</Link>
                  <div className="muted">By {item.submittedBy}</div>
                </td>
                <td>{item.status}</td>
                <td>{item.currentVersionNumber ? `v${item.currentVersionNumber}` : 'None'}</td>
                <td>{new Date(item.submittedAt).toLocaleString()}</td>
                <td>
                  <textarea
                    className="input textarea textarea--compact"
                    placeholder={item.latestComment ?? 'Enter approval or rejection comment'}
                    value={comments[item.documentId] ?? ''}
                    onChange={(event) => setComments((current) => ({ ...current, [item.documentId]: event.target.value }))}
                  />
                </td>
                <td>
                  <div className="actions actions--compact">
                    <button className="button" type="button" onClick={() => void runDecision(item.documentId, 'approve')}>
                      Approve
                    </button>
                    <button className="button button--secondary" type="button" onClick={() => void runDecision(item.documentId, 'reject')}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">No documents are currently pending review.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
