import React from 'react';
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
  return (
    <div className="stack stack--xl">
      {canManage && (
        <section className="form-section stack--compact">
          <h3 className="form-section__title">Upload New Version</h3>
          <p className="muted">Uploading a new PDF will increment the version number and reset the document status to Draft.</p>
          <form className="form-grid" onSubmit={onUpload}>
            <div className="grid-2">
              <div>
                <label className="sidebar__status-label">Change Summary</label>
                <input
                  className="input"
                  placeholder="What changed in this version?"
                  value={versionInput?.changeSummary ?? ''}
                  onChange={(e) => onVersionInputChange({ changeSummary: e.target.value })}
                />
              </div>
              <div>
                <label className="sidebar__status-label">Original PDF (Required)</label>
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
                Upload Version
              </button>
            </div>
          </form>
        </section>
      )}

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
                      Restore
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
