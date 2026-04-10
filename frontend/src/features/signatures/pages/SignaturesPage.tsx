import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { EmptyState } from '../../../shared/components/ui/EmptyState';



import { useAuth } from '../../auth/context/useAuth';
import { getPendingSignatures, rejectDocumentSignature, signDocumentSignature } from '../../documents/api/documentsApi';
import type { PendingSignature } from '../../documents/types';

export function SignaturesPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<PendingSignature[]>([]);
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
        const payload = await getPendingSignatures(accessToken);
        if (!ignore) {
          setItems(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load pending signatures.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  async function refresh() {
    if (!accessToken) {
      return;
    }

    const payload = await getPendingSignatures(accessToken);
    setItems(payload);
  }

  async function runAction(item: PendingSignature, action: 'sign' | 'reject') {
    if (!accessToken) {
      return;
    }

    try {
      if (action === 'sign') {
        await signDocumentSignature(item.documentId, item.signatureRequestId, { comment: comments[item.signatureRequestId] }, accessToken);
      } else {
        await rejectDocumentSignature(item.documentId, item.signatureRequestId, { comment: comments[item.signatureRequestId] }, accessToken);
      }

      await refresh();
      setNotice(action === 'sign' ? 'Document signed successfully.' : 'Signature request rejected.');
      setError(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to process signature request.');
      setNotice(null);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Pending signature queue"
        eyebrow="Signatures"
        description="Assigned signers complete PDF signature steps here in configured order."
      />

      <section className="panel stack">


      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Version</th>
              <th>Order</th>
              <th>Page</th>
              <th>Position</th>
              <th>Comment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.signatureRequestId}>
                <td>
                  <Link to={`/documents/${item.documentId}`}>{item.documentTitle}</Link>
                </td>
                <td>v{item.versionNumber}</td>
                <td>{item.signingOrder}</td>
                <td>{item.pageNumber}</td>
                <td>{item.positionX}, {item.positionY} ({item.width} × {item.height})</td>
                <td>
                  <textarea
                    className="input textarea textarea--compact"
                    placeholder={item.comment ?? 'Optional signature comment'}
                    value={comments[item.signatureRequestId] ?? ''}
                    onChange={(event) => setComments((current) => ({ ...current, [item.signatureRequestId]: event.target.value }))}
                  />
                </td>
                <td>
                  <div className="actions actions--compact">
                    <button className="button" type="button" onClick={() => void runAction(item, 'sign')}>
                      Sign
                    </button>
                    <button className="button button--secondary" type="button" onClick={() => void runAction(item, 'reject')}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState 
                    title="No pending signatures" 
                    description="You have no documents assigned for signature at this time." 
                  />
                </td>
              </tr>
            ) : null}

          </tbody>
        </table>
      </div>
    </section>
  );
}
