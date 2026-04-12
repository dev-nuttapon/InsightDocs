import React, { useMemo, useState } from 'react';
import { CreateVersionInput, DocumentVersion } from '../types';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { useTranslation } from '../../../i18n/useTranslation';

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
  const { t } = useTranslation();
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
          <h3 className="form-section__title">{t('documents.uploadVersionTitle')}</h3>
          <p className="muted">{t('documents.uploadVersionDescription')}</p>
          <form className="form-grid" onSubmit={onUpload}>
            <div className="grid-2">
              <div>
                <label className="sidebar__status-label">{t('documents.changeSummaryLabel')}</label>
                <input
                  className="input"
                  placeholder={t('documents.changeSummaryPlaceholder')}
                  value={versionInput?.changeSummary ?? ''}
                  onChange={(e) => onVersionInputChange({ changeSummary: e.target.value })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">{t('documents.originalPdfLabel')}</label>
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
                {t('documents.createVersion')}
              </button>
            </div>
          </form>
        </section>
      )}

      {sortedVersions.length > 1 ? (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">{t('documents.compareVersionsTitle')}</h3>
          <p className="muted">{t('documents.compareVersionsDescription')}</p>

          <div className="grid-2">
            <label className="stack">
              <span className="sidebar__status-label">{t('documents.baseVersion')}</span>
              <select
                className="input input--select"
                value={compareBase?.id ?? ''}
                onChange={(event) => setCompareBaseId(event.target.value)}
              >
                {sortedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} {version.isCurrent ? t('documents.currentSuffix') : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack">
              <span className="sidebar__status-label">{t('documents.targetVersion')}</span>
              <select
                className="input input--select"
                value={compareTarget?.id ?? ''}
                onChange={(event) => setCompareTargetId(event.target.value)}
              >
                {sortedVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} {version.isCurrent ? t('documents.currentSuffix') : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {compareBase && compareTarget ? (
            <div className="version-compare-grid">
              <article className="version-compare-card">
                <span className="card__label">{t('documents.referenceVersion')}</span>
                <strong>v{compareBase.versionNumber}</strong>
                <div className="muted">{compareBase.changeSummary}</div>
                <div className="version-compare-card__meta">
                  <span>{compareBase.createdBy}</span>
                  <span>{new Date(compareBase.createdAt).toLocaleString()}</span>
                </div>
                <div className="tag-list">
                  {compareBase.hasOriginalPdf ? <span className="tag">{t('documents.originalPdfTag')}</span> : null}
                  {compareBase.hasSignedPdf ? <span className="tag">{t('documents.signedPdfTag')}</span> : null}
                </div>
              </article>

              <article className="version-compare-card version-compare-card--accent">
                <span className="card__label">{t('documents.selectedVersion')}</span>
                <strong>v{compareTarget.versionNumber}</strong>
                <div className="muted">{compareTarget.changeSummary}</div>
                <div className="version-compare-card__meta">
                  <span>{compareTarget.createdBy}</span>
                  <span>{new Date(compareTarget.createdAt).toLocaleString()}</span>
                </div>
                <div className="tag-list">
                  {compareTarget.hasOriginalPdf ? <span className="tag">{t('documents.originalPdfTag')}</span> : null}
                  {compareTarget.hasSignedPdf ? <span className="tag">{t('documents.signedPdfTag')}</span> : null}
                </div>
              </article>
            </div>
          ) : null}

          {compareBase && compareTarget ? (
            <div className="version-diff-list">
              <div className="version-diff-item">
                <strong>{t('documents.versionNumberDiff')}</strong>
                <span className="muted">v{compareBase.versionNumber} to v{compareTarget.versionNumber}</span>
              </div>
              <div className="version-diff-item">
                <strong>{t('documents.changeSummaryDiff')}</strong>
                <span className="muted">{compareTarget.changeSummary}</span>
              </div>
              <div className="version-diff-item">
                <strong>{t('documents.signedPdfDiff')}</strong>
                <span className="muted">
                  {compareBase.hasSignedPdf ? t('documents.referenceHasSigned') : t('documents.referenceMissingSigned')}
                  {' / '}
                  {compareTarget.hasSignedPdf ? t('documents.selectedHasSigned') : t('documents.selectedMissingSigned')}
                </span>
              </div>
              <div className="version-diff-item">
                <strong>{t('documents.checksumDiff')}</strong>
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
              <th>{t('documents.versionsTab')}</th>
              <th>{t('documents.currentStatus')}</th>
              <th>{t('documents.filesColumn')}</th>
              <th>{t('documents.changeSummaryDiff')} &amp; {t('documents.checksumDiff')}</th>
              <th>{t('documents.authorColumn')}</th>
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
                    {v.hasOriginalPdf && <span className="tag">{t('documents.originalPdfTag')}</span>}
                    {v.hasSignedPdf && <span className="tag">{t('documents.signedPdfTag')}</span>}
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
                      {t('documents.restore')}
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
