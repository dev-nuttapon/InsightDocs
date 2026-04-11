import { useEffect, useState } from 'react';

import { approvePasswordResetRequest, getPasswordResetRequests, rejectPasswordResetRequest, type PasswordResetRequest } from '../api/authApi';
import { useAuth } from '../context/useAuth';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';

export function AdminPasswordResetRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await getPasswordResetRequests(accessToken);
        if (!ignore) {
          setRequests(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load reset requests.');
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

    const payload = await getPasswordResetRequests(accessToken);
    setRequests(payload);
  }

  async function handleApprove(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      const result = await approvePasswordResetRequest(id, 'Approved by admin.', accessToken);
      await refresh();
      setNotice(result.resetUrl ? `Reset link generated: ${result.resetUrl}` : 'Request approved.');
      setError(null);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Approval failed.');
      setNotice(null);
    }
  }

  async function handleReject(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      await rejectPasswordResetRequest(id, 'Rejected by admin.', accessToken);
      await refresh();
      setNotice('Request rejected.');
      setError(null);
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Rejection failed.');
      setNotice(null);
    }
  }

  async function handleCopy(resetUrl: string | null) {
    if (!resetUrl) {
      return;
    }

    await navigator.clipboard.writeText(resetUrl);
    setNotice('Reset link copied.');
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Password Reset Requests"
        eyebrow="Administration"
        description="Review and process manual password reset requests. Approved requests generate a secure link that must be manually provided to the user."
      />

      <section className="panel stack">
        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <div className="table-wrap">
          <table className="table table--premium">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Generated Link</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{request.displayName}</div>
                    <div className="muted" style={{ fontSize: '11px' }}>{request.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{new Date(request.requestedAt).toLocaleDateString()}</div>
                    <div className="muted" style={{ fontSize: '11px' }}>{new Date(request.requestedAt).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <StatusBadge status={request.status === 'Pending' ? 'Pending' : (request.status === 'Approved' ? 'Approved' : 'Rejected')} />
                  </td>
                  <td className="table__link-cell" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {request.resetUrl ? (
                      <code style={{ fontSize: '11px', background: 'var(--color-bg-alt)', padding: '2px 4px', borderRadius: '4px' }}>
                        {request.resetUrl}
                      </code>
                    ) : (
                      <span className="muted">Pending approval</span>
                    )}
                  </td>
                  <td>
                    <div className="actions actions--compact">
                      {request.status === 'Pending' ? (
                        <>
                          <button className="button" type="button" onClick={() => void handleApprove(request.id)}>Approve</button>
                          <button className="button button--secondary" type="button" onClick={() => void handleReject(request.id)}>Reject</button>
                        </>
                      ) : null}
                      {request.resetUrl ? (
                        <button className="button button--secondary" type="button" onClick={() => void handleCopy(request.resetUrl)}>Copy Link</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState 
                      title="No active requests" 
                      description="There are no pending password reset requests in the administrative queue." 
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
