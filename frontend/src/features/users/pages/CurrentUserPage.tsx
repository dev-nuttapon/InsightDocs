import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';

export function CurrentUserPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((role) => ['Admin', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role));
  const canReviewDocuments = roles.some((role) => ['Admin', 'Manager', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role));
  const canSignDocuments = roles.some((role) => ['Admin', 'Signer', 'admin', 'realm-admin', 'insightdocs-admin'].includes(role));

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">User Information</span>
        <h2>My Profile</h2>
        <p className="muted">
          หน้าแรกหลัง login จะแสดงข้อมูลผู้ใช้งานและสิทธิ์ที่ระบบอ่านได้จาก session ปัจจุบัน
        </p>
      </div>

      <div className="hero-grid">
        <article className="card">
          <span className="card__label">Identity</span>
          <div className="stack">
            <div>Username: {user?.username ?? 'Unavailable'}</div>
            <div>Email: {user?.email ?? 'Unavailable'}</div>
            <div>Subject: {user?.subject ?? 'Unavailable'}</div>
          </div>
        </article>

        <article className="card">
          <span className="card__label">Access Scope</span>
          <div className="stack">
            <div>Roles: {roles.length > 0 ? roles.join(', ') : 'No mapped roles'}</div>
            <div>Approvals: {canReviewDocuments ? 'Enabled' : 'Not assigned'}</div>
            <div>Signatures: {canSignDocuments ? 'Enabled' : 'Not assigned'}</div>
            <div>Admin: {isAdmin ? 'Enabled' : 'Not assigned'}</div>
          </div>
        </article>
      </div>

      <div className="hero-grid">
        <article className="card card--interactive">
          <span className="card__label">Documents</span>
          <h3>Open document workspace</h3>
          <p className="muted">ไปยัง registry เอกสารเพื่อดูรายการ, เวอร์ชัน, และงานเอกสารที่เกี่ยวข้อง</p>
          <div className="actions">
            <Link className="button" to="/documents">Open Documents</Link>
          </div>
        </article>

        {canReviewDocuments ? (
          <article className="card card--interactive">
            <span className="card__label">Approvals</span>
            <h3>Review pending work</h3>
            <p className="muted">เปิดรายการเอกสารที่รอการอนุมัติจากบทบาทของคุณ</p>
            <div className="actions">
              <Link className="button" to="/approvals">Open Approvals</Link>
            </div>
          </article>
        ) : (
          <article className="card">
            <span className="card__label">Status</span>
            <h3>No approval queue</h3>
            <p className="muted">บัญชีนี้ยังไม่มีบทบาทที่ต้องตรวจอนุมัติเอกสาร</p>
          </article>
        )}
      </div>
    </section>
  );
}
