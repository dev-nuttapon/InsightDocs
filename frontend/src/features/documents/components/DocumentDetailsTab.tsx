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
          <span className="card__label">Lifecycle</span>
          <div>Versions tracked: {document.versionCount}</div>
          <div>Review status: {document.status}</div>
          <div>Category: {document.category ?? 'Uncategorized'}</div>
          <div>Signed PDF: {document.currentVersionNumber ? 'Available (if signed)' : 'Not available'}</div>
        </article>

        <article className="card stack">
          <span className="card__label">Audit</span>
          <div>Created at: {new Date(document.createdAt).toLocaleString()}</div>
          <div>Updated at: {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : 'Not updated'}</div>
          <div>Owner: {document.ownerDisplayName ?? 'Unassigned'}</div>
          <div>Controller: {document.controllerDisplayName ?? 'Unassigned'}</div>
        </article>
      </div>

      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">Update Document Metadata</h3>
          <p className="muted">Modifying these details will return the document to Draft status if it is currently Approved or In Review.</p>
          <form className="form-grid" onSubmit={onSave}>
            <div>
              <label className="sidebar__status-label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => onFormChange({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">Description</label>
              <textarea
                className="input textarea"
                value={form.description ?? ''}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="sidebar__status-label">Category</label>
              <input
                className="input"
                placeholder="e.g. Finance, Legal, HR"
                value={form.category ?? ''}
                onChange={(e) => onFormChange({ category: e.target.value })}
              />
            </div>
            <div className="actions">
              <button className="button" type="submit">Save Changes</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
