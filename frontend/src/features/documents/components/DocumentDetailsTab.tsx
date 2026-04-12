import React from 'react';
import { DocumentDetail, UpdateDocumentInput } from '../types';
import { useTranslation } from '../../../i18n/useTranslation';

interface DocumentDetailsTabProps {
  document: DocumentDetail;
  form: UpdateDocumentInput;
  canManage: boolean;
  onFormChange: (patch: Partial<UpdateDocumentInput>) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function DocumentDetailsTab({ document, form, canManage, onFormChange, onSave }: DocumentDetailsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="stack stack--xl">
      <div className="grid-2">
        <article className="card stack">
          <span className="card__label">{t('documents.lifecycle')}</span>
          <div>{t('documents.totalVersions', { count: document.versionCount })}</div>
          <div>{t('documents.statusNow', { value: document.status })}</div>
          <div>{t('documents.categoryNow', { value: document.category ?? t('documents.uncategorized') })}</div>
          <div>{t('documents.signedPdfState', { value: document.currentVersionNumber ? t('documents.signedPdfReady') : t('documents.signedPdfMissing') })}</div>
        </article>

        <article className="card stack">
          <span className="card__label">{t('documents.ownership')}</span>
          <div>{t('documents.createdAt', { value: new Date(document.createdAt).toLocaleString() })}</div>
          <div>{t('documents.updatedAt', { value: document.updatedAt ? new Date(document.updatedAt).toLocaleString() : t('documents.notUpdated') })}</div>
          <div>{t('documents.ownerNow', { value: document.ownerDisplayName ?? t('documents.unassigned') })}</div>
          <div>{t('documents.controllerNow', { value: document.controllerDisplayName ?? t('documents.unassigned') })}</div>
        </article>
      </div>

      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">{t('documents.editTitle')}</h3>
          <p className="muted">{t('documents.editDescription')}</p>
          <form className="form-grid" onSubmit={onSave}>
            <div>
              <label className="sidebar__status-label">{t('documents.documentName')}</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => onFormChange({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">{t('documents.descriptionField')}</label>
              <textarea
                className="input textarea"
                value={form.description ?? ''}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">{t('documents.category')}</label>
              <input
                className="input"
                placeholder={t('documents.categoryPlaceholder')}
                value={form.category ?? ''}
                onChange={(e) => onFormChange({ category: e.target.value })}
              />
            </div>
            <div className="actions">
              <button className="button" type="submit">{t('documents.saveChanges')}</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
