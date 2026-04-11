import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';


import { useAuth } from '../../auth/context/useAuth';
import { getAuditLog, getAuditLogs } from '../api/auditApi';
import type { AuditLogDetail, AuditLogFilters, AuditLogListResponse } from '../types';

import { StatCard } from '../../../shared/components/ui/StatCard';
import { Timeline, TimelineItem } from '../../../shared/components/ui/Timeline';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';

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

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!selectedLog) return [];
    return [
      {
        id: 'actor',
        title: 'Actor Information',
        time: selectedLog.actorDisplayName ?? selectedLog.actorUsername ?? 'System',
        body: <div className="muted">{selectedLog.actorUserId ? `User ID: ${selectedLog.actorUserId}` : 'Internal Event'}</div>,
        status: 'info',
      },
      {
        id: 'action',
        title: 'Action Performed',
        time: selectedLog.action,
        body: <div className="muted">Target: {selectedLog.entityType} ({selectedLog.entityId ?? 'N/A'})</div>,
        status: selectedLog.action.toLowerCase().includes('reject') || selectedLog.action.toLowerCase().includes('delete') ? 'danger' : 'success',
      },
      {
        id: 'document',
        title: 'Related Document',
        time: selectedLog.relatedDocumentId ? 'Linked' : 'None',
        body: selectedLog.relatedDocumentId ? (
          <Link to={`/documents/${selectedLog.relatedDocumentId}`} className="button button--secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
            View Document
          </Link>
        ) : null,
        status: 'info',
      },
    ];
  }, [selectedLog]);

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Audit log"
        eyebrow="Audit"
        description="Review append-only compliance events across registration, password reset, documents, approvals, and signatures."
      />

      <div className="dashboard-summary-grid">
        <StatCard label="Total Activities" value={results?.totalCount ?? 0} />
        <StatCard label="Recent Events" value={results?.items.length ?? 0} />
        <StatCard label="Active Filters" value={Object.values(filters).filter(v => typeof v === 'string' && v.trim() !== '' && v !== '1' && v !== '20').length} />
      </div>

      <section className="panel stack">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">Actor Identity</span>
            <input className="input" placeholder="Name or Email" value={filters.actor ?? ''} onChange={(event) => updateFilters({ actor: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">Action Type</span>
            <input className="input" placeholder="e.g. Approved, Create" value={filters.action ?? ''} onChange={(event) => updateFilters({ action: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">Document Context</span>
            <input className="input" placeholder="UUID" value={filters.documentId ?? ''} onChange={(event) => updateFilters({ documentId: event.target.value, page: 1 })} />
          </div>
          <button 
            className="button button--secondary" 
            type="button"
            style={{ height: '42px' }}
            onClick={() => updateFilters(defaultFilters)}
            disabled={Object.entries(filters).every(([k, v]) => k === 'page' || k === 'pageSize' || v === '')}
          >
            Reset
          </button>
        </div>

        <div className="filter-chip-list">
          {filters.from && <span className="filter-chip"><span className="filter-chip__label">From:</span> {filters.from} <button className="filter-chip__remove" onClick={() => updateFilters({ from: '' })}>×</button></span>}
          {filters.to && <span className="filter-chip"><span className="filter-chip__label">To:</span> {filters.to} <button className="filter-chip__remove" onClick={() => updateFilters({ to: '' })}>×</button></span>}
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}

        <div className="split-layout split-layout--wide">
          <div className="table-wrap">
            <table className="table table--premium">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / Entity</th>
                  <th>Action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results?.items.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => void handleSelectAuditLog(item.id)} 
                    className={`table__row--interactive ${selectedLog?.id === item.id ? 'active' : ''}`}
                    style={selectedLog?.id === item.id ? { backgroundColor: 'var(--color-primary-soft)', borderLeft: '4px solid var(--color-primary)' } : {}}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{new Date(item.timestamp).toLocaleTimeString()}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{new Date(item.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div>{item.actorDisplayName ?? item.actorUsername ?? 'System'}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{item.entityType}</div>
                    </td>
                    <td>
                      <StatusBadge status={item.action.includes('Approved') || item.action.includes('Success') ? 'Approved' : item.action.includes('Reject') ? 'Rejected' : 'Pending'} />
                      <div style={{ marginTop: '4px', fontSize: '12px' }}>{item.action}</div>
                    </td>
                    <td>
                      <span className="muted" style={{ fontSize: '18px' }}>›</span>
                    </td>
                  </tr>
                ))}
                {(results?.items.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title="No logs found" description="Adjust your filters to see more activity records." />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <aside className="stack">
            <div className="panel stack" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
              <h3 className="form-section__title">Event Detail</h3>
              {selectedLog ? (
                <div className="stack">
                  <Timeline items={timelineItems} />
                  <div className="audit-meta-viewer">
                    <div className="muted" style={{ marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase' }}>Structured Metadata</div>
                    <pre>{formattedMetadata}</pre>
                  </div>
                </div>
              ) : (
                <EmptyState 
                  title="Nothing Selected" 
                  description="Click an audit entry on the left to inspect the secure metadata and event context." 
                />
              )}
            </div>
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
    </div>
);
}
