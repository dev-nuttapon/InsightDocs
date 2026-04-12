import { Link } from 'react-router-dom';

import { useTranslation } from '../../../i18n/useTranslation';
import { getSampleDocuments } from '../../mock/sampleDocuments';

export function SampleDocumentsShowcase() {
  const { language, t } = useTranslation();
  const documents = getSampleDocuments(language);

  return (
    <section className="sample-documents">
      <div className="section-heading">
        <span className="sidebar__eyebrow">{t('demo.sampleDocumentsEyebrow')}</span>
        <h3>{t('demo.sampleDocumentsTitle')}</h3>
      </div>

      <div className="sample-documents__list">
        {documents.map((document) => (
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
                <strong>{t('demo.pdfPreview')}</strong>
                <span className="muted">{t('demo.preview')}</span>
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
                    <strong>{t('demo.signer1')}</strong>
                    <span>{t('demo.digitalVisible')}</span>
                  </div>
                  <div className="sample-documents__preview-signature-box">
                    <strong>{t('demo.signer2')}</strong>
                    <span>{t('demo.digitalVisible')}</span>
                  </div>
                </div>
              </div>
              <div className="muted sample-documents__preview-note">
                {t('demo.previewNote')}
              </div>
            </div>

            <div className="callout">
              <strong>{t('demo.nextStep')}</strong>
              <div className="muted">{document.nextAction}</div>
            </div>

            <div className="sample-documents__actions">
              <a
                className="button"
                href={document.pdfPath}
                target="_blank"
                rel="noreferrer"
              >
                {t('demo.openSamplePdf')}
              </a>
              <a
                className="button button--secondary"
                href={document.pdfPath}
                download
              >
                {t('demo.downloadPdf')}
              </a>
              <Link className="button button--secondary" to="/documents">
                {t('demo.viewInRegistry')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
