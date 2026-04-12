import React from 'react';
import { DocumentDetail, UpdateDocumentInput } from '../types';

interface DocumentDetailsTabProps {
  document: DocumentDetail;
  form: UpdateDocumentInput;
  canManage: boolean;
  onFormChange: (patch: Partial<UpdateDocumentInput>) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function DocumentDetailsTab({ document, form, canManage, onFormChange, onSave }: DocumentDetailsTabProps) {
  return (
    <div className="stack stack--xl">
      <div className="grid-2">
        <article className="card stack">
          <span className="card__label">Document Lifecycle</span>
          <div>เวอร์ชันทั้งหมด: {document.versionCount}</div>
          <div>สถานะปัจจุบัน: {document.status}</div>
          <div>หมวดหมู่: {document.category ?? 'Uncategorized'}</div>
          <div>Signed PDF: {document.currentVersionNumber ? 'พร้อมเมื่อจบการลงนาม' : 'ยังไม่มีเวอร์ชันปัจจุบัน'}</div>
        </article>

        <article className="card stack">
          <span className="card__label">Ownership & Traceability</span>
          <div>สร้างเมื่อ: {new Date(document.createdAt).toLocaleString()}</div>
          <div>อัปเดตล่าสุด: {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : 'Not updated'}</div>
          <div>Owner: {document.ownerDisplayName ?? 'Unassigned'}</div>
          <div>Controller: {document.controllerDisplayName ?? 'Unassigned'}</div>
        </article>
      </div>

      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">แก้ไขข้อมูลเอกสาร</h3>
          <p className="muted">เมื่อปรับ metadata ของเอกสาร ระบบจะพากลับไป Draft หากเอกสารเคยอยู่ในขั้นอนุมัติหรืออนุมัติแล้ว เพื่อรักษาความถูกต้องของ workflow</p>
          <form className="form-grid" onSubmit={onSave}>
            <div>
              <label className="sidebar__status-label">ชื่อเอกสาร</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => onFormChange({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">คำอธิบาย</label>
              <textarea
                className="input textarea"
                value={form.description ?? ''}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">หมวดหมู่</label>
              <input
                className="input"
                placeholder="เช่น Finance, Legal, HR"
                value={form.category ?? ''}
                onChange={(e) => onFormChange({ category: e.target.value })}
              />
            </div>
            <div className="actions">
              <button className="button" type="submit">บันทึกการเปลี่ยนแปลง</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
