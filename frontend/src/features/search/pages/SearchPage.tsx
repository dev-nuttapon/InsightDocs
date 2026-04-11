import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { SampleDocumentsShowcase } from '../../../shared/components/mock/SampleDocumentsShowcase';



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

      <ModuleMockup
        eyebrow="Search Mockup"
        title="พื้นที่ค้นหาเอกสารแบบหลายเงื่อนไข"
        description="หน้านี้ใช้ค้นหาเอกสารจากคำค้น หมวดหมู่ สถานะ และผู้เกี่ยวข้อง พร้อมเปิดดูรายละเอียดเอกสารที่ต้องใช้ได้ทันที"
        highlights={['Keyword Search', 'Advanced Filters', 'Signature Summary', 'Quick Open']}
        steps={[
          'ใส่คำค้นหรือเงื่อนไขที่ต้องการ',
          'ไล่ดูผลลัพธ์พร้อมสถานะและ summary การลงนาม',
          'เปิดเอกสารที่ต้องการเพื่อตรวจสอบรายละเอียดต่อ',
        ]}
        metrics={[
          { label: 'รูปแบบการค้นหา', value: 'Metadata + Full-text' },
          { label: 'ผลลัพธ์ที่คาดหวัง', value: results ? `${results.totalCount} รายการ` : 'พร้อมค้นหา' },
        ]}
      />

      <SampleDocumentsShowcase />

      <section className="panel stack">


      <div className="stack stack--compact">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">Knowledge Search</span>
            <input className="input" placeholder="Keywords..." value={filters.query} onChange={(event) => updateFilters({ query: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">Department / Tag</span>
            <input className="input" placeholder="Category" value={filters.category} onChange={(event) => updateFilters({ category: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group" style={{ maxWidth: '240px' }}>
            <span className="filter-bar__label">Lifecycle State</span>
            <select className="input input--select" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
              <option value="">Any Status</option>
              <option value="Draft">Draft</option>
              <option value="InReview">InReview</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <button 
            className="button button--secondary" 
            type="button" 
            style={{ height: '42px' }}
            onClick={() => updateFilters({ ...defaultFilters, page: 1 })}
            disabled={Object.entries(filters).every(([k, v]) => k === 'page' || k === 'pageSize' || v === '')}
          >
            Clear All
          </button>
        </div>

        <div className="filter-chip-list">
          {filters.query && (
            <span className="filter-chip">
              <span className="filter-chip__label">Query:</span> {filters.query}
              <button className="filter-chip__remove" onClick={() => updateFilters({ query: '' })}>×</button>
            </span>
          )}
          {filters.category && (
            <span className="filter-chip">
              <span className="filter-chip__label">Category:</span> {filters.category}
              <button className="filter-chip__remove" onClick={() => updateFilters({ category: '' })}>×</button>
            </span>
          )}
          {filters.status && (
            <span className="filter-chip">
              <span className="filter-chip__label">Status:</span> {filters.status}
              <button className="filter-chip__remove" onClick={() => updateFilters({ status: '' })}>×</button>
            </span>
          )}
          {filters.owner && (
            <span className="filter-chip">
              <span className="filter-chip__label">Owner:</span> {filters.owner}
              <button className="filter-chip__remove" onClick={() => updateFilters({ owner: '' })}>×</button>
            </span>
          )}
        </div>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      <div className="table-wrap">
        <table className="table table--premium">
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Category</th>
              <th>Owner / Controller</th>
              <th>Current Version</th>
              <th>Signature Summary</th>
            </tr>
          </thead>
          <tbody>
            {results?.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/documents/${item.id}`} style={{ fontWeight: 700, fontSize: '15px' }}>{item.title}</Link>
                  <div className="muted" style={{ marginTop: '2px' }}>{item.description ?? 'No description'}</div>
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>

                <td>{item.category ?? 'Uncategorized'}</td>
                <td>
                  <div>{item.ownerDisplayName ?? item.ownerUsername ?? 'None'}</div>
                  <div className="muted" style={{ fontSize: '12px' }}>Ctrl: {item.controllerDisplayName ?? item.controllerUsername ?? 'None'}</div>
                </td>
                <td>{item.currentVersionNumber ? `v${item.currentVersionNumber}` : 'None'}</td>
                <td>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Total: {item.signatureSummary.totalRequests}</div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Signed {item.signatureSummary.signedCount} / Pending {item.signatureSummary.pendingCount}
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
  </div>
);
}
