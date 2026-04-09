import { useEffect, useState } from 'react';

import { approvePasswordResetRequest, getPasswordResetRequests, rejectPasswordResetRequest, type PasswordResetRequest } from '../api/authApi';
import { useAuth } from '../context/useAuth';

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
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Admin</span>
        <h2>Password Reset Requests</h2>
        <p className="muted">Approve or reject password reset requests. After approval, copy the reset link and send it manually to the user.</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Reset Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.displayName}<div className="muted">{request.username} | {request.email}</div></td>
                <td>{new Date(request.requestedAt).toLocaleString()}</td>
                <td>{request.status}</td>
                <td className="table__link-cell">{request.resetUrl ?? 'Pending approval'}</td>
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
          </tbody>
        </table>
      </div>
    </section>
  );
}
