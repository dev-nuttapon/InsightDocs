import { useEffect, useState } from 'react';

import { approvePasswordResetRequest, getPasswordResetRequests, rejectPasswordResetRequest, type PasswordResetRequest } from '../api/authApi';
import { useAuth } from '../context/useAuth';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';

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
        title="คำขอรีเซ็ตรหัสผ่าน"
        eyebrow="Administration"
        description="ตรวจสอบคำขอรีเซ็ตรหัสผ่าน อนุมัติหรือปฏิเสธคำขอ และคัดลอกลิงก์รีเซ็ตเพื่อส่งต่อให้ผู้ใช้งานด้วยตนเอง"
      />

      <ModuleMockup
        eyebrow="Reset Flow Mockup"
        title="คิวคำขอรีเซ็ตรหัสผ่านที่ดูแลโดยผู้ดูแลระบบ"
        description="ใช้ตรวจคำขอรีเซ็ตรหัสผ่านแบบไม่ส่งอีเมลอัตโนมัติ อนุมัติหรือปฏิเสธ และคัดลอกลิงก์รีเซ็ตเพื่อส่งให้ผู้ใช้ด้วยตนเอง"
        highlights={['Pending Request', 'Approve / Reject', 'Manual Link Sharing', 'Audit-ready Flow']}
        steps={[
          'เปิดคำขอที่ผู้ใช้ส่งเข้ามา',
          'อนุมัติหรือปฏิเสธตามนโยบายขององค์กร',
          'คัดลอกลิงก์รีเซ็ตและส่งต่อให้ผู้ใช้ด้วยช่องทางภายใน',
        ]}
        metrics={[
          { label: 'คำขอทั้งหมด', value: `${requests.length} รายการ` },
          { label: 'รูปแบบการส่งลิงก์', value: 'Manual Admin Hand-off' },
        ]}
      />

      <div className="dashboard-summary-grid">
        <StatCard label="คำขอทั้งหมด" value={requests.length} />
        <StatCard label="รอพิจารณา" value={requests.filter((request) => request.status === 'Pending').length} />
        <StatCard label="อนุมัติแล้ว" value={requests.filter((request) => request.status === 'Approved').length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">Queue</span>
          <h3>รายการคำขอ</h3>
        </div>

        {requests.length === 0 ? (
          <EmptyState 
            title="ไม่มีคำขอรีเซ็ตรหัสผ่าน" 
            description="คำขอที่ผู้ใช้ส่งเข้ามาเพื่อรีเซ็ตรหัสผ่านจะแสดงในส่วนนี้เมื่อมีรายการใหม่" 
          />
        ) : (
          <div className="registry-list">
            {requests.map((request) => (
              <article key={request.id} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <div className="registry-item__title">{request.displayName}</div>
                      <p className="muted">{request.email}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="registry-meta">
                    <span>ผู้ร้องขอ: {request.requestedByIdentifier}</span>
                    <span>วันที่ {new Date(request.requestedAt).toLocaleDateString()}</span>
                    <span>เวลา {new Date(request.requestedAt).toLocaleTimeString()}</span>
                  </div>

                  {request.reviewComment ? (
                    <div className="callout">
                      <strong>ความเห็นการพิจารณา</strong>
                      <div className="muted">{request.reviewComment}</div>
                    </div>
                  ) : null}

                  {request.resetUrl ? (
                    <div className="callout">
                      <strong>ลิงก์รีเซ็ตรหัสผ่าน</strong>
                      <div className="audit-metadata">
                        <code>{request.resetUrl}</code>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  {request.status === 'Pending' ? (
                    <>
                      <button className="button" type="button" onClick={() => void handleApprove(request.id)}>
                        อนุมัติ
                      </button>
                      <button className="button button--secondary" type="button" onClick={() => void handleReject(request.id)}>
                        ปฏิเสธ
                      </button>
                    </>
                  ) : null}
                  {request.resetUrl ? (
                    <button className="button button--secondary" type="button" onClick={() => void handleCopy(request.resetUrl)}>
                      คัดลอกลิงก์
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
