import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { getAuditLog, getAuditLogs } from '../api/auditApi';
import type { AuditLogDetail, AuditLogFilters, AuditLogListResponse } from '../types';

const defaultFilters: AuditLogFilters = {
  actor: '',
  action: '',
  documentId: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
};

export function AuditLogsPage() {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<AuditLogFilters>({
    actor: searchParams.get('actor') ?? '',
    action: searchParams.get('action') ?? '',
    documentId: searchParams.get('documentId') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
    page: Number(searchParams.get('page') ?? defaultFilters.page),
    pageSize: Number(searchParams.get('pageSize') ?? defaultFilters.pageSize),
  });
  const [results, setResults] = useState<AuditLogListResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await getAuditLogs(accessToken, filters);
        if (!ignore) {
          setResults(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load audit logs.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, filters]);

  async function handleSelectAuditLog(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      const detail = await getAuditLog(id, accessToken);
      setSelectedLog(detail);
      setError(null);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Unable to load audit log detail.');
    }
  }

  function updateFilters(patch: Partial<AuditLogFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params, { replace: true });
  }

  const totalPages = useMemo(
    () => results ? Math.max(1, Math.ceil(results.totalCount / results.pageSize)) : 1,
    [results],
  );
  const formattedMetadata = useMemo(() => {
    if (!selectedLog?.metadataJson) {
      return 'No metadata';
    }

    try {
      return JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2);
    } catch {
      return selectedLog.metadataJson;
    }
  }, [selectedLog]);

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Audit</span>
        <h2>Audit log</h2>
        <p className="muted">Review append-only compliance events across registration, password reset, documents, approvals, and signatures.</p>
      </div>

      <div className="form-grid">
        <div className="hero-grid hero-grid--stacked">
          <input className="input" placeholder="Actor" value={filters.actor} onChange={(event) => updateFilters({ actor: event.target.value, page: 1 })} />
          <input className="input" placeholder="Action" value={filters.action} onChange={(event) => updateFilters({ action: event.target.value, page: 1 })} />
          <input className="input" placeholder="Related document id" value={filters.documentId} onChange={(event) => updateFilters({ documentId: event.target.value, page: 1 })} />
          <input className="input" type="datetime-local" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value, page: 1 })} />
          <input className="input" type="datetime-local" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value, page: 1 })} />
        </div>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="hero-grid">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {results?.items.map((item) => (
                <tr key={item.id} onClick={() => void handleSelectAuditLog(item.id)} className="table__row--interactive">
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>{item.actorDisplayName ?? item.actorUsername ?? 'System / anonymous'}</td>
                  <td>{item.action}</td>
                  <td>{item.entityType}</td>
                  <td>
                    <div className="stack stack--compact">
                      {item.relatedDocumentId ? <Link to={`/documents/${item.relatedDocumentId}`}>Document</Link> : null}
                      {item.actorUserId ? <Link to={`/users/${item.actorUserId}/edit`}>User</Link> : null}
                    </div>
                  </td>
                </tr>
              ))}
              {(results?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">No audit logs found for the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="card stack">
          <span className="card__label">Detail</span>
          {selectedLog ? (
            <>
              <div><strong>{selectedLog.action}</strong></div>
              <div className="muted">{new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div>Actor: {selectedLog.actorDisplayName ?? selectedLog.actorUsername ?? 'System / anonymous'}</div>
              <div>Entity: {selectedLog.entityType}</div>
              <div>Entity Id: {selectedLog.entityId ?? 'N/A'}</div>
              <div>Related document: {selectedLog.relatedDocumentId ?? 'N/A'}</div>
              <div>Related version: {selectedLog.relatedVersionId ?? 'N/A'}</div>
              <pre className="audit-metadata">{formattedMetadata}</pre>
            </>
          ) : (
            <p className="muted">Select an audit row to inspect structured metadata.</p>
          )}
        </aside>
      </div>

      <div className="actions">
        <button className="button button--secondary" disabled={filters.page <= 1} type="button" onClick={() => updateFilters({ page: filters.page - 1 })}>
          Previous
        </button>
        <span className="muted">Page {filters.page} of {totalPages}</span>
        <button className="button button--secondary" disabled={filters.page >= totalPages} type="button" onClick={() => updateFilters({ page: filters.page + 1 })}>
          Next
        </button>
      </div>
    </section>
  );
}
