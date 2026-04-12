import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { DemoDocumentSpotlight } from '../../../shared/components/mock/DemoDocumentSpotlight';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import {
  demoApproveDocument,
  demoRejectDocument,
  getDemoPendingApprovals,
  getDemoScenarioState,
} from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

import { useAuth } from '../../auth/context/useAuth';
import { approveDocument, getPendingApprovals, rejectDocument } from '../../documents/api/documentsApi';
import type { PendingApproval } from '../../documents/types';

export function ApprovalsPage() {
  const { accessToken } = useAuth();
  const demoMode = isDemoModeEnabled();
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scenarioState = getDemoScenarioState('demo-policy-014');

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setItems(getDemoPendingApprovals());
          setError(null);
        }
        return;
      }

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
  }, [accessToken, demoMode]);

  async function runDecision(documentId: string, action: 'approve' | 'reject') {
    if (demoMode) {
      if (action === 'approve') {
        demoApproveDocument(documentId, comments[documentId] ?? '', null);
      } else {
        demoRejectDocument(documentId, comments[documentId] ?? '', null);
      }

      setItems(getDemoPendingApprovals());
      setNotice(action === 'approve' ? 'อนุมัติเอกสารตัวอย่างแล้วในโหมด demo' : 'ปฏิเสธเอกสารตัวอย่างแล้วในโหมด demo');
      setError(null);
      return;
    }

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
    <div className="stack stack--xl">
      <PageHeader
        title="คิวรออนุมัติ"
        eyebrow="Approvals"
        description="ตรวจสอบเอกสารที่ถูกส่งเข้ามาเพื่ออนุมัติ พร้อมบันทึกความเห็นและดำเนินการอนุมัติหรือปฏิเสธได้จากหน้านี้"
      />

      <ModuleMockup
        eyebrow="Approval Mockup"
        title="คิวพิจารณาเอกสารสำหรับผู้อนุมัติ"
        description="ใช้หน้านี้ในการเปิดเอกสาร ตรวจเวอร์ชันปัจจุบัน บันทึกความเห็น และตัดสินใจอนุมัติหรือปฏิเสธจาก workflow เดียว"
        highlights={['Pending Queue', 'Review Comment', 'Approve / Reject', 'Open Document']}
        steps={[
          'เลือกเอกสารที่ถูกส่งเข้ามาในคิวอนุมัติ',
          'อ่านข้อมูลสำคัญและเปิดเอกสารเพื่อตรวจสอบก่อนตัดสินใจ',
          'บันทึกความเห็นแล้วอนุมัติหรือปฏิเสธทันทีจากคิวงาน',
        ]}
        metrics={[
          { label: 'สถานะคิว', value: `${items.length} รายการ` },
          { label: 'รูปแบบงาน', value: 'Manager Review Flow' },
        ]}
      />

      <DemoScenarioPanel
        compact
        state={scenarioState}
        secondaryAction={{ label: 'เปิดเอกสารที่รออนุมัติ', to: '/documents/demo-policy-014' }}
      />

      {demoMode ? (
        <DemoDocumentSpotlight
          documentId="demo-policy-014"
          eyebrow="Decision Context"
          title="เอกสารหลักที่ใช้สาธิตการอนุมัติ"
          description="กรรมการควรเห็นว่า manager ไม่ได้กดปุ่มอนุมัติอย่างเดียว แต่มีบริบทครบทั้งเวอร์ชันปัจจุบัน การเปลี่ยนแปลงล่าสุด และสถานะถัดไปของเอกสาร"
          primaryActionLabel="เปิดเอกสารเพื่อพิจารณา"
        />
      ) : null}

      <div className="dashboard-summary-grid">
        <StatCard label="รออนุมัติทั้งหมด" value={items.length} />
        <StatCard label="ต้องพิจารณาวันนี้" value={items.filter((item) => isToday(item.submittedAt)).length} />
        <StatCard label="มีความเห็นล่าสุด" value={items.filter((item) => Boolean(item.latestComment)).length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">Queue</span>
          <h3>รายการที่ต้องตัดสินใจ</h3>
        </div>

        {items.length === 0 ? (
          <EmptyState 
            title="ไม่มีรายการรออนุมัติ" 
            description="เอกสารที่ส่งเข้ามาเพื่อพิจารณาจะแสดงในส่วนนี้เมื่อมีรายการใหม่" 
          />
        ) : (
          <div className="registry-list">
            {items.map((item) => (
              <article key={item.documentId} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${item.documentId}`}>
                        {item.documentTitle}
                      </Link>
                      <p className="muted">
                        ส่งโดย {item.submittedBy} เมื่อ {new Date(item.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="registry-meta">
                    <span>เวอร์ชัน {item.currentVersionNumber ?? 1}</span>
                    <span>{isToday(item.submittedAt) ? 'ส่งเข้ามาวันนี้' : `วันที่ ${new Date(item.submittedAt).toLocaleDateString()}`}</span>
                  </div>

                  {item.latestComment ? (
                    <div className="callout">
                      <strong>ความเห็นล่าสุด</strong>
                      <div className="muted">{item.latestComment}</div>
                    </div>
                  ) : null}

                  <label className="stack">
                    <span className="card__label">ความเห็นประกอบการพิจารณา</span>
                    <textarea
                      className="input textarea textarea--compact"
                      placeholder="ระบุเหตุผลประกอบการอนุมัติหรือปฏิเสธ"
                      value={comments[item.documentId] ?? ''}
                      onChange={(event) => setComments((current) => ({ ...current, [item.documentId]: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  <Link className="button button--secondary" to={`/documents/${item.documentId}`}>
                    เปิดเอกสาร
                  </Link>
                  <button className="button" type="button" onClick={() => void runDecision(item.documentId, 'approve')}>
                    อนุมัติ
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => void runDecision(item.documentId, 'reject')}>
                    ปฏิเสธ
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function isToday(value: string) {
  const target = new Date(value);
  const now = new Date();

  return target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate();
}
