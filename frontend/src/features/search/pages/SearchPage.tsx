import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';



import { useAuth } from '../../auth/context/useAuth';
import { searchDocuments } from '../api/searchApi';
import type { SearchDocumentsResponse, SearchFilters } from '../types';

const defaultFilters: SearchFilters = {
  query: '',
  category: '',
  status: '',
  owner: '',
  controller: '',
  signer: '',
  archived: '',
  page: 1,
  pageSize: 10,
};

export function SearchPage() {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    query: searchParams.get('query') ?? '',
    category: searchParams.get('category') ?? '',
    status: searchParams.get('status') ?? '',
    owner: searchParams.get('owner') ?? '',
    controller: searchParams.get('controller') ?? '',
    signer: searchParams.get('signer') ?? '',
    archived: searchParams.get('archived') ?? '',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: Number(searchParams.get('pageSize') ?? '10'),
  });
  const [results, setResults] = useState<SearchDocumentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!accessToken) {
        return;
      }

      try {
        const payload = await searchDocuments(accessToken, filters);
        if (!ignore) {
          setResults(payload);
          setError(null);
        }
      } catch (searchError) {
        if (!ignore) {
          setError(searchError instanceof Error ? searchError.message : 'Unable to search documents.');
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, filters]);

  function updateFilters(patch: Partial<SearchFilters>) {
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

  const totalPages = results ? Math.max(1, Math.ceil(results.totalCount / results.pageSize)) : 1;

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Document search"
        eyebrow="Search"
        description="Search document metadata and current signature state using PostgreSQL filters and full-text search."
      />

      <section className="panel stack">


      <div className="form-grid">
        <input className="input" placeholder="Keyword search" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value, page: 1 })} />
        <div className="hero-grid hero-grid--stacked">
          <input className="input" placeholder="Category" value={filters.category} onChange={(event) => updateFilters({ category: event.target.value, page: 1 })} />
          <select className="input input--select" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="InReview">InReview</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
          <input className="input" placeholder="Owner" value={filters.owner} onChange={(event) => updateFilters({ owner: event.target.value, page: 1 })} />
          <input className="input" placeholder="Controller" value={filters.controller} onChange={(event) => updateFilters({ controller: event.target.value, page: 1 })} />
          <input className="input" placeholder="Signer" value={filters.signer} onChange={(event) => updateFilters({ signer: event.target.value, page: 1 })} />
          <select className="input input--select" value={filters.archived} onChange={(event) => updateFilters({ archived: event.target.value, page: 1 })}>
            <option value="">Archived and active</option>
            <option value="false">Exclude archived</option>
            <option value="true">Only archived</option>
          </select>
        </div>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Controller</th>
              <th>Current Version</th>
              <th>Signature Summary</th>
            </tr>
          </thead>
          <tbody>
            {results?.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/documents/${item.id}`}>{item.title}</Link>
                  <div className="muted">{item.description ?? 'No description'}</div>
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>

                <td>{item.category ?? 'Uncategorized'}</td>
                <td>{item.ownerDisplayName ?? item.ownerUsername ?? 'Unassigned'}</td>
                <td>{item.controllerDisplayName ?? item.controllerUsername ?? 'Unassigned'}</td>
                <td>{item.currentVersionNumber ? `v${item.currentVersionNumber}` : 'None'}</td>
                <td>
                  <div>Total: {item.signatureSummary.totalRequests}</div>
                  <div className="muted">
                    Pending {item.signatureSummary.pendingCount} / Signed {item.signatureSummary.signedCount} / Rejected {item.signatureSummary.rejectedCount}
                  </div>
                </td>
              </tr>
            ))}
            {(results?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState 
                    title="No results" 
                    description="No documents matched your search criteria. Try adjusting your filters." 
                  />
                </td>
              </tr>
            ) : null}

          </tbody>
        </table>
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
