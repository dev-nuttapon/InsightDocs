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
        title="Document registry"
        eyebrow="Documents"
        description="Manage enterprise PDFs and open a document to inspect or restore version history."
      />

      <section className="panel stack">


      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      {access.canManageDocuments ? (
        <form className="form-grid" onSubmit={handleCreate}>
          <input
            className="input"
            placeholder="Document title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            className="input textarea"
            placeholder="Description"
            value={form.description ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Category"
            value={form.category ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          />
          <button className="button" type="submit">Create Document</button>
        </form>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th>Current Version</th>
              <th>Versions</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td>
                  <Link to={`/documents/${document.id}`}>{document.title}</Link>
                  <div className="muted">{document.description ?? 'No description'}</div>
                </td>
                <td>
                  <StatusBadge status={document.status} />
                </td>
                <td>{document.category ?? 'Uncategorized'}</td>
                <td>{document.currentVersionNumber ? `v${document.currentVersionNumber}` : 'None'}</td>
                <td>{document.versionCount}</td>
                <td>{new Date(document.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {(documents?.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState 
                    title="No documents" 
                    description="The registry is currently empty. Upload your first PDF to get started." 
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
