import React, { useMemo, useState } from 'react';
import { CreateVersionInput, DocumentVersion } from '../types';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';

interface DocumentVersionsTabProps {
  versions: DocumentVersion[];
  canManage: boolean;
  versionInput: CreateVersionInput | null;
  onVersionInputChange: (patch: Partial<CreateVersionInput>) => void;
  onUpload: (event: React.FormEvent<HTMLFormElement>) => void;
  onRestore: (versionId: string, versionNumber: number) => void;
}

export function DocumentVersionsTab({
  versions,
  canManage,
  versionInput,
  onVersionInputChange,
  onUpload,
  onRestore,
}: DocumentVersionsTabProps) {
  const [compareBaseId, setCompareBaseId] = useState<string>('');
  const [compareTargetId, setCompareTargetId] = useState<string>('');

  const sortedVersions = useMemo(
    () => [...versions].sort((left, right) => right.versionNumber - left.versionNumber),
    [versions],
  );

  const compareBase = useMemo(
    () => sortedVersions.find((version) => version.id === compareBaseId) ?? sortedVersions[1] ?? sortedVersions[0] ?? null,
    [compareBaseId, sortedVersions],
  );

  const compareTarget = useMemo(
    () => sortedVersions.find((version) => version.id === compareTargetId) ?? sortedVersions[0] ?? null,
    [compareTargetId, sortedVersions],
  );

  return (
    <div className="stack stack--xl">
      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">อัปโหลดเวอร์ชันใหม่</h3>
          <p className="muted">ทุกการอัปโหลดจะสร้างเวอร์ชันใหม่แยกจากฉบับเดิม และถ้าเอกสารเคยผ่าน review มาแล้ว สถานะจะกลับไปเป็น Draft เพื่อควบคุมการเปลี่ยนแปลงอย่างปลอดภัย</p>
          <form className="form-grid" onSubmit={onUpload}>
            <div className="grid-2">
              <div>
                <label className="sidebar__status-label">สรุปการเปลี่ยนแปลง</label>
                <input
                  className="input"
                  placeholder="ระบุว่าเวอร์ชันนี้เปลี่ยนอะไรจากฉบับก่อน"
                  value={versionInput?.changeSummary ?? ''}
                  onChange={(e) => onVersionInputChange({ changeSummary: e.target.value })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">ไฟล์ PDF ต้นฉบับ</label>
                <input
                  accept=".pdf"
                  className="input"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onVersionInputChange({ originalPdf: file });
                  }}
                />
              </div>
            </div>
            <div className="actions">
              <button
                className="button"
                disabled={!versionInput?.originalPdf || !versionInput.changeSummary}
                type="submit"
              >
                สร้างเวอร์ชันใหม่
              </button>
            </div>
          </form>
        </section>
      )}

      {sortedVersions.length > 1 ? (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">เปรียบเทียบเวอร์ชัน</h3>
          <p className="muted">ใช้มุมมองนี้เพื่ออธิบายให้กรรมการเห็นว่าแต่ละเวอร์ชันต่างกันอย่างไร และทำไมการเปลี่ยนแปลงจึงต้องย้อนกลับสู่ Draft ก่อนเข้าสู่ workflow อีกครั้ง</p>

          <div className="grid-2">
            <label className="stack">
              <span className="sidebar__status-label">เวอร์ชันอ้างอิง</span>
              <select
                className="input input--select"
                value={compareBase?.id ?? ''}
                onChange={(event) => setCompareBaseId(event.target.value)}
              >
                {sortedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} {version.isCurrent ? '(current)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack">
              <span className="sidebar__status-label">เวอร์ชันที่ต้องการอธิบาย</span>
              <select
                className="input input--select"
                value={compareTarget?.id ?? ''}
                onChange={(event) => setCompareTargetId(event.target.value)}
              >
                {sortedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} {version.isCurrent ? '(current)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {compareBase && compareTarget ? (
            <div className="version-compare-grid">
              <article className="version-compare-card">
                <span className="card__label">เวอร์ชันอ้างอิง</span>
                <strong>v{compareBase.versionNumber}</strong>
                <div className="muted">{compareBase.changeSummary}</div>
                <div className="version-compare-card__meta">
                  <span>{compareBase.createdBy}</span>
                  <span>{new Date(compareBase.createdAt).toLocaleString()}</span>
                </div>
                <div className="tag-list">
                  {compareBase.hasOriginalPdf ? <span className="tag">Original PDF</span> : null}
                  {compareBase.hasSignedPdf ? <span className="tag">Signed PDF</span> : null}
                </div>
              </article>

              <article className="version-compare-card version-compare-card--accent">
                <span className="card__label">เวอร์ชันที่เลือก</span>
                <strong>v{compareTarget.versionNumber}</strong>
                <div className="muted">{compareTarget.changeSummary}</div>
                <div className="version-compare-card__meta">
                  <span>{compareTarget.createdBy}</span>
                  <span>{new Date(compareTarget.createdAt).toLocaleString()}</span>
                </div>
                <div className="tag-list">
                  {compareTarget.hasOriginalPdf ? <span className="tag">Original PDF</span> : null}
                  {compareTarget.hasSignedPdf ? <span className="tag">Signed PDF</span> : null}
                </div>
              </article>
            </div>
          ) : null}

          {compareBase && compareTarget ? (
            <div className="version-diff-list">
              <div className="version-diff-item">
                <strong>เลขเวอร์ชัน</strong>
                <span className="muted">v{compareBase.versionNumber} to v{compareTarget.versionNumber}</span>
              </div>
              <div className="version-diff-item">
                <strong>สรุปการเปลี่ยนแปลง</strong>
                <span className="muted">{compareTarget.changeSummary}</span>
              </div>
              <div className="version-diff-item">
                <strong>Signed PDF</strong>
                <span className="muted">
                  {compareBase.hasSignedPdf ? 'เวอร์ชันอ้างอิงมี' : 'เวอร์ชันอ้างอิงยังไม่มี'}
                  {' / '}
                  {compareTarget.hasSignedPdf ? 'เวอร์ชันที่เลือกมี' : 'เวอร์ชันที่เลือกยังไม่มี'}
                </span>
              </div>
              <div className="version-diff-item">
                <strong>Checksum</strong>
                <span className="muted">{compareBase.checksum} to {compareTarget.checksum}</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Files</th>
              <th>Summary & Checksum</th>
              <th>Author</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>v{v.versionNumber}</strong>
                </td>
                <td>
                  <StatusBadge status={v.isCurrent ? 'Active' : 'Archived'} />
                </td>
                <td>
                  <div className="stack stack--compact">
                    {v.hasOriginalPdf && <span className="tag">Original PDF</span>}
                    {v.hasSignedPdf && <span className="tag">Signed PDF</span>}
                  </div>
                </td>
                <td>
                  <div>{v.changeSummary}</div>
                  <div className="muted checksum">{v.checksum}</div>
                </td>
                <td>
                  <div>{v.createdBy}</div>
                  <div className="muted">{new Date(v.createdAt).toLocaleString()}</div>
                </td>
                <td>
                  {canManage && !v.isCurrent && (
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => onRestore(v.id, v.versionNumber)}
                    >
                      กู้คืน
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
