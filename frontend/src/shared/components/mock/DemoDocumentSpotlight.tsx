import { Link } from 'react-router-dom';

import { useTranslation } from '../../../i18n/useTranslation';
import {
  getDemoApprovalHistory,
  getDemoDocumentDetail,
  getDemoDocumentSignatures,
  getDemoDocumentVersions,
} from '../../mock/demoScenario';
import { StatusBadge } from '../ui/StatusBadge';

type DemoDocumentSpotlightProps = {
  documentId: string;
  eyebrow?: string;
  title: string;
  description: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

export function DemoDocumentSpotlight({
  documentId,
  eyebrow = 'Demo Focus',
  title,
  description,
  primaryActionLabel = 'เปิดหน้าเอกสาร',
  secondaryActionLabel = 'เปิด PDF ตัวอย่าง',
}: DemoDocumentSpotlightProps) {
  const { language, t } = useTranslation();
  const document = getDemoDocumentDetail(documentId, language);
  const versions = getDemoDocumentVersions(documentId);
  const approvals = getDemoApprovalHistory(documentId);
  const signatures = getDemoDocumentSignatures(documentId);

  if (!document) {
    return null;
  }

  const currentVersion = versions.find((version) => version.isCurrent) ?? versions[0] ?? null;
  const pendingSignatures = signatures.filter((signature) => signature.status === 'Pending').length;
  const signedCount = signatures.filter((signature) => signature.status === 'Signed').length;
  const latestApproval = approvals[0] ?? null;

  return (
    <section className="demo-spotlight">
      <div className="demo-spotlight__copy">
        <span className="sidebar__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p className="muted">{description}</p>

        <div className="demo-spotlight__actions">
          <Link className="button" to={`/documents/${documentId}`}>
            {primaryActionLabel || t('demo.openDocument')}
          </Link>
          <a
            className="button button--secondary"
            href={getMockPdfPath(documentId)}
            target="_blank"
            rel="noreferrer"
          >
            {secondaryActionLabel || t('demo.openSamplePdf')}
          </a>
        </div>
      </div>

      <article className="demo-spotlight__card">
        <div className="demo-spotlight__header">
          <div className="stack stack--compact">
            <strong>{document.title}</strong>
            <span className="muted">{document.category} · {document.ownerDisplayName ?? 'Unassigned'}</span>
          </div>
          <StatusBadge status={document.status} />
        </div>

        <div className="demo-spotlight__stats">
          <div className="demo-spotlight__stat">
            <span className="card__label">{t('demo.spotlightVersion')}</span>
            <strong>{currentVersion ? `v${currentVersion.versionNumber}` : '-'}</strong>
          </div>
          <div className="demo-spotlight__stat">
            <span className="card__label">{t('demo.spotlightPending')}</span>
            <strong>{pendingSignatures}</strong>
          </div>
          <div className="demo-spotlight__stat">
            <span className="card__label">{t('demo.spotlightSigned')}</span>
            <strong>{signedCount}</strong>
          </div>
        </div>

        <div className="demo-spotlight__timeline">
          <div className="demo-spotlight__line" />
          <div className="demo-spotlight__event">
            <span className="card__label">{t('demo.spotlightLatestVersion')}</span>
            <strong>{currentVersion?.changeSummary ?? t('demo.noVersionInfo')}</strong>
          </div>
          <div className="demo-spotlight__event">
            <span className="card__label">{t('demo.spotlightLatestApproval')}</span>
            <strong>{latestApproval ? `${latestApproval.action} · ${latestApproval.performedBy}` : t('demo.noApprovalHistory')}</strong>
          </div>
        </div>
      </article>
    </section>
  );
}

function getMockPdfPath(documentId: string) {
  switch (documentId) {
    case 'demo-contract-001':
      return '/mock-pdfs/consulting-services-contract.pdf';
    case 'demo-policy-014':
      return '/mock-pdfs/expense-approval-policy-2026.pdf';
    case 'demo-hr-008':
      return '/mock-pdfs/employee-appointment-letter.pdf';
    default:
      return '/documents';
  }
}
