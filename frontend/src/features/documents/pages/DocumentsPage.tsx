import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';



import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import { createDocument, getDocuments } from '../api/documentsApi';
import type { CreateDocumentInput, DocumentSummary } from '../types';

export function DocumentsPage() {
  const { accessToken, user } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [form, setForm] = useState<CreateDocumentInput>({ title: '', description: '', category: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const access = buildAccessProfile(user?.roles ?? []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await getDocuments(accessToken);
        if (!ignore) {
          setDocuments(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load documents.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      const created = await createDocument(form, accessToken);
      setDocuments((current) => [
        {
          id: created.id,
          title: created.title,
          description: created.description,
          category: created.category,
          ownerUserId: created.ownerUserId,
          ownerDisplayName: created.ownerDisplayName,
          controllerUserId: created.controllerUserId,
          controllerDisplayName: created.controllerDisplayName,
          status: created.status,
          versionCount: created.versionCount,
          currentVersionNumber: created.currentVersionNumber,
          createdAt: created.createdAt,
          createdBy: created.createdBy,
        },
        ...current,
      ]);
      setForm({ title: '', description: '', category: '' });
      setNotice(`Created document "${created.title}".`);
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create document.');
      setNotice(null);
    }
  }

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Document Registry"
        eyebrow="Documents"
        description="Manage enterprise PDFs and open a document to inspect or restore version history."
      />

      <div className="grid-sidebar">
        <section className="stack">
          {access.canManageDocuments && (
            <div className="panel stack" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div className="section-heading">
                <span className="sidebar__eyebrow">Controls</span>
                <h3>Register New Document</h3>
              </div>
              <form className="stack" onSubmit={handleCreate}>
                <label className="stack">
                  <span className="card__label">Title</span>
                  <input
                    className="input"
                    placeholder="Document title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                </label>
                <div className="grid-2">
                  <label className="stack">
                    <span className="card__label">Category</span>
                    <input
                      className="input"
                      placeholder="e.g. Legal, HR"
                      value={form.category ?? ''}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    />
                  </label>
                  <div className="stack" style={{ justifyContent: 'end' }}>
                     <button className="button" type="submit" style={{ width: '100%' }}>Create Entry</button>
                  </div>
                </div>
                <label className="stack">
                  <span className="card__label">Description</span>
                  <textarea
                    className="input textarea textarea--compact"
                    placeholder="Optional description"
                    value={form.description ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
              </form>
            </div>
          )}

          <div className="panel stack">
            <div className="section-heading">
              <span className="sidebar__eyebrow">List</span>
              <h3>Active Controlled Documents</h3>
            </div>

            {error ? <div className="callout callout--danger">{error}</div> : null}
            {notice ? <div className="callout">{notice}</div> : null}

            <div className="table-wrap">
              <table className="table table--premium">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Metadata</th>
                    <th>Versions</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <Link to={`/documents/${document.id}`} style={{ fontWeight: 700 }}>{document.title}</Link>
                        <div className="muted" style={{ fontSize: '12px' }}>{document.description || 'No description provided'}</div>
                      </td>
                      <td>
                        <StatusBadge status={document.status} />
                      </td>
                      <td>
                        <div className="status-pill status-pill--subtle">{document.category || 'Uncategorized'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>v{document.currentVersionNumber || '0'}</div>
                        <div className="muted" style={{ fontSize: '11px' }}>{document.versionCount} records</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{new Date(document.createdAt).toLocaleDateString()}</div>
                        <div className="muted" style={{ fontSize: '11px' }}>{document.ownerDisplayName || 'System'}</div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState 
                          title="No documents" 
                          description="The registry is currently empty. Upload your first PDF to get started." 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
