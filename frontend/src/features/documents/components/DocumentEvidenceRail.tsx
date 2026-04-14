import { useMemo } from 'react';

import { useTranslation } from '../../../i18n/useTranslation';
import type {
  DocumentApprovalHistoryItem,
  DocumentDetail,
  DocumentSignatureRequest,
  DocumentVersion,
} from '../types';

type DocumentEvidenceRailProps = {
  document: DocumentDetail;
  versions: DocumentVersion[];
  approvalHistory: DocumentApprovalHistoryItem[];
  signatures: DocumentSignatureRequest[];
};

export function DocumentEvidenceRail({
  document,
  versions,
  approvalHistory,
  signatures,
}: DocumentEvidenceRailProps) {
  const { t } = useTranslation();

  const currentVersion = useMemo(
    () => versions.find((version) => version.isCurrent) ?? versions[0] ?? null,
    [versions],
  );
  const latestApproval = approvalHistory[approvalHistory.length - 1] ?? null;
  const signedCount = signatures.filter((signature) => signature.status === 'Signed').length;
  const pendingSignature = signatures
    .filter((signature) => signature.status === 'Pending')
    .sort((left, right) => left.signingOrder - right.signingOrder)[0] ?? null;

  const evidenceCards = [
    {
      label: t('documents.evidenceVersionLabel'),
      title: currentVersion ? `v${currentVersion.versionNumber}` : t('documents.noVersion'),
      detail: currentVersion?.changeSummary ?? t('documents.noVersionContext'),
    },
    {
      label: t('documents.evidenceApprovalLabel'),
      title: latestApproval
        ? t(`documents.approvalAction${latestApproval.action}`)
        : t('documents.evidenceAwaitingApproval'),
      detail: latestApproval
        ? t('documents.evidenceApprovalDetail', {
            actor: latestApproval.performedBy,
            date: new Date(latestApproval.performedAt).toLocaleDateString(),
          })
        : t('documents.evidenceApprovalPendingDetail'),
    },
    {
      label: t('documents.evidenceSignatureLabel'),
      title: t('documents.evidenceSignatureCoverage', {
        signed: signedCount,
        total: signatures.length,
      }),
      detail: pendingSignature
        ? t('documents.evidenceNextSigner', {
            signer: pendingSignature.signerDisplayName,
            order: pendingSignature.signingOrder,
          })
        : t('documents.evidenceAllSigned'),
    },
    {
      label: t('documents.evidenceAuditLabel'),
      title: t('documents.evidenceAuditReady'),
      detail: t('documents.evidenceAuditDetail', {
        versionCount: versions.length,
        approvalCount: approvalHistory.length,
        signatureCount: signatures.length,
      }),
    },
  ];

  return (
    <section className="document-evidence">
      <div className="document-evidence__header">
        <div className="stack stack--compact">
          <span className="sidebar__eyebrow">{t('documents.evidenceEyebrow')}</span>
          <h3>{t('documents.evidenceTitle')}</h3>
          <p className="muted">{t('documents.evidenceDescription')}</p>
        </div>
        <div className="document-evidence__summary">
          <span className="card__label">{t('documents.currentStatus')}</span>
          <strong>{document.status}</strong>
          <span className="muted">
            {t('documents.versionMeta', {
              value: document.currentVersionNumber ? `v${document.currentVersionNumber}` : t('documents.none'),
            })}
          </span>
        </div>
      </div>

      <div className="document-evidence__grid">
        {evidenceCards.map((card) => (
          <article key={card.label} className="document-evidence__card">
            <span className="card__label">{card.label}</span>
            <strong>{card.title}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
