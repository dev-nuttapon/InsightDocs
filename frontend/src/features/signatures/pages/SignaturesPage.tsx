import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { SampleDocumentsShowcase } from '../../../shared/components/mock/SampleDocumentsShowcase';

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
        title="คิวรอลงนาม"
        eyebrow="Signatures"
        description="เอกสารที่ถูกมอบหมายให้คุณลงนามจะแสดงในหน้านี้ พร้อมตำแหน่งลายเซ็น รูปแบบลายเซ็นบนเอกสาร และความเห็นประกอบก่อนดำเนินการ"
      />

      <ModuleMockup
        eyebrow="Signature Mockup"
        title="คิวงานลงนามพร้อมตำแหน่งลายเซ็น"
        description="หน้านี้ใช้สำหรับดูรายการที่ได้รับมอบหมาย ตรวจตำแหน่งลายเซ็นบน PDF และดำเนินการลงนามหรือปฏิเสธตามลำดับที่กำหนด"
        highlights={['Signing Queue', 'Hybrid Signature', 'Sequential Order', 'Visible Placement']}
        steps={[
          'เลือกเอกสารที่ได้รับมอบหมายให้ลงนาม',
          'ตรวจตำแหน่งลายเซ็นและข้อมูลประกอบก่อนลงนาม',
          'ลงนามหรือปฏิเสธ พร้อมบันทึกเหตุผลในคิวงาน',
        ]}
        metrics={[
          { label: 'งานรอดำเนินการ', value: `${items.length} รายการ` },
          { label: 'โหมดสาธิต', value: 'Hybrid Signature Demo' },
        ]}
      />

      <SampleDocumentsShowcase />

      <div className="dashboard-summary-grid">
        <StatCard label="รอลงนามทั้งหมด" value={items.length} />
        <StatCard label="ลำดับแรก" value={items.filter((item) => item.signingOrder === 1).length} />
        <StatCard label="มีความเห็นแนบ" value={items.filter((item) => Boolean(item.comment)).length} />
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <div className="callout">
        <strong>รูปแบบลายเซ็นที่ใช้ใน demo</strong>
        <div className="muted">ระบบสาธิตการลงนามแบบผสม โดยแสดงทั้งข้อมูลการลงนามดิจิทัลและพื้นที่รูปลายเซ็นที่วางบน PDF เพื่อให้ผู้อ่านเห็นร่องรอยการลงนามในเอกสารโดยตรง</div>
      </div>

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">Queue</span>
          <h3>รายการที่ต้องลงนาม</h3>
        </div>

        {items.length === 0 ? (
          <EmptyState 
            title="ไม่มีรายการรอลงนาม" 
            description="เอกสารที่ถูกมอบหมายให้คุณลงนามจะปรากฏในส่วนนี้เมื่อมีรายการใหม่" 
          />
        ) : (
          <div className="registry-list">
            {items.map((item) => (
              <article key={item.signatureRequestId} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${item.documentId}`}>
                        {item.documentTitle}
                      </Link>
                      <p className="muted">
                        เวอร์ชัน {item.versionNumber} • ลำดับการลงนาม {item.signingOrder}
                      </p>
                    </div>
                    <span className="status-pill status-pill--subtle">ลำดับ {item.signingOrder}</span>
                  </div>

                  <div className="registry-meta">
                    <span>หน้า {item.pageNumber}</span>
                    <span>ตำแหน่ง X:{item.positionX} Y:{item.positionY}</span>
                    <span>ขนาด {item.width} × {item.height}</span>
                    <span>รูปแบบ Hybrid Signature</span>
                  </div>

                  <div className="signature-preview-panel signature-preview-panel--inline">
                    <div className="signature-preview signature-preview--hybrid">
                      <div className="signature-preview__stamp">ลงนามอิเล็กทรอนิกส์</div>
                      <div className="signature-preview__identity">
                        <div className="signature-preview__avatar">SG</div>
                        <div className="stack stack--compact">
                          <strong>กรอบลายเซ็นบนเอกสาร</strong>
                          <span className="muted">แสดงชื่อผู้ลงนาม เวลา และรูปลายเซ็นประกอบบน PDF</span>
                        </div>
                      </div>
                      <div className="signature-preview__image">
                        <span className="signature-preview__scribble">Signature</span>
                      </div>
                    </div>
                  </div>

                  {item.comment ? (
                    <div className="callout">
                      <strong>ความเห็นก่อนลงนาม</strong>
                      <div className="muted">{item.comment}</div>
                    </div>
                  ) : null}

                  <label className="stack">
                    <span className="card__label">ความเห็นประกอบการดำเนินการ</span>
                    <textarea
                      className="input textarea textarea--compact"
                      placeholder="ระบุความเห็นเพิ่มเติมก่อนลงนามหรือปฏิเสธ"
                      value={comments[item.signatureRequestId] ?? ''}
                      onChange={(event) => setComments((current) => ({ ...current, [item.signatureRequestId]: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="registry-item__actions registry-item__actions--stack">
                  <Link className="button button--secondary" to={`/documents/${item.documentId}`}>
                    เปิดเอกสาร
                  </Link>
                  <button className="button" type="button" onClick={() => void runAction(item, 'sign')}>
                    ลงนาม
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => void runAction(item, 'reject')}>
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
