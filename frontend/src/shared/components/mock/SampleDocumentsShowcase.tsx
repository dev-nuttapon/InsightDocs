import { Link } from 'react-router-dom';

import { SAMPLE_DOCUMENTS } from '../../mock/sampleDocuments';

export function SampleDocumentsShowcase() {
  return (
    <section className="sample-documents">
      <div className="section-heading">
        <span className="sidebar__eyebrow">Sample Documents</span>
        <h3>ชุดเอกสารตัวอย่างสำหรับ demo</h3>
      </div>

      <div className="sample-documents__list">
        {SAMPLE_DOCUMENTS.map((document) => (
          <article key={document.id} className="sample-documents__item">
            <div className="sample-documents__header">
              <div className="stack stack--compact">
                <strong>{document.title}</strong>
                <span className="muted">{document.category} • {document.currentVersion}</span>
              </div>
              <span className="tag">{document.status}</span>
            </div>

            <div className="sample-documents__meta">
              <span>Owner: {document.owner}</span>
              <span>Controller: {document.controller}</span>
            </div>

            <div className="sample-documents__preview">
              <div className="sample-documents__preview-header">
                <strong>ตัวอย่าง PDF</strong>
                <span className="muted">Preview</span>
              </div>
              <div className="sample-documents__preview-sheet" aria-hidden="true">
                <div className="sample-documents__preview-bar">
                  <span className="sample-documents__preview-dot" />
                  <span className="sample-documents__preview-dot" />
                  <span className="sample-documents__preview-dot" />
                </div>
                <div className="sample-documents__preview-badge">PDF</div>
                <div className="sample-documents__preview-title">{document.title}</div>
                <div className="sample-documents__preview-meta">
                  <span>{document.category}</span>
                  <span>{document.currentVersion}</span>
                </div>
                <div className="sample-documents__preview-lines">
                  <span />
                  <span />
                  <span />
                  <span className="short" />
                </div>
                <div className="sample-documents__preview-signatures">
                  <div className="sample-documents__preview-signature-box">
                    <strong>Signer 1</strong>
                    <span>Digital + Visible</span>
                  </div>
                  <div className="sample-documents__preview-signature-box">
                    <strong>Signer 2</strong>
                    <span>Digital + Visible</span>
                  </div>
                </div>
              </div>
              <div className="muted sample-documents__preview-note">
                แสดงเป็น mock preview ในหน้า เพื่อให้เห็นภาพเดียวกันทุก browser ส่วนไฟล์จริงเปิดได้จากปุ่มด้านล่าง
              </div>
            </div>

            <div className="callout">
              <strong>ขั้นตอนถัดไป</strong>
              <div className="muted">{document.nextAction}</div>
            </div>

            <div className="sample-documents__actions">
              <a
                className="button"
                href={document.pdfPath}
                target="_blank"
                rel="noreferrer"
              >
                เปิด PDF ตัวอย่าง
              </a>
              <a
                className="button button--secondary"
                href={document.pdfPath}
                download
              >
                ดาวน์โหลด PDF
              </a>
              <Link className="button button--secondary" to="/documents">
                ดูในทะเบียนเอกสาร
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
