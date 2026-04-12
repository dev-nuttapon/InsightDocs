import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { DemoScenarioPanel } from '../../../shared/components/mock/DemoScenarioPanel';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { SampleDocumentsShowcase } from '../../../shared/components/mock/SampleDocumentsShowcase';
import { getDemoScenarioState, getDemoSearchResults } from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';
import { useTranslation } from '../../../i18n/useTranslation';

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
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
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
  const scenarioState = getDemoScenarioState('demo-contract-001', language);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setResults(getDemoSearchResults(filters, language));
          setError(null);
        }
        return;
      }

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
          setError(searchError instanceof Error ? searchError.message : t('search.loadError'));
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [accessToken, demoMode, filters, language, t]);

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
        title={t('search.title')}
        eyebrow={t('search.eyebrow')}
        description={t('search.description')}
      />

      <ModuleMockup
        eyebrow={t('search.mockupEyebrow')}
        title={t('search.mockupTitle')}
        description={t('search.mockupDescription')}
        highlights={t('search.mockupHighlights').split('|||')}
        steps={t('search.mockupSteps').split('|||')}
        metrics={[
          { label: t('search.searchMode'), value: t('search.metadataMode') },
          { label: t('search.expectedResults'), value: results ? t('approvals.queueItems', { count: results.totalCount }) : t('search.readyToSearch') },
        ]}
      />

      <DemoScenarioPanel
        compact
        state={{
          ...scenarioState,
          badge: t('search.searchableBadge'),
          headline: t('search.searchableHeadline'),
          nextStep: t('search.searchableNextStep'),
          primaryAction: { label: t('search.openPrimaryDemo'), to: '/documents/demo-contract-001' },
        }}
        secondaryAction={{ label: t('common.backToRegistry'), to: '/documents' }}
      />

      <SampleDocumentsShowcase />

      <section className="panel stack">


      <div className="stack stack--compact">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">{t('search.queryLabel')}</span>
            <input className="input" placeholder={t('search.queryPlaceholder')} value={filters.query} onChange={(event) => updateFilters({ query: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">{t('search.categoryLabel')}</span>
            <input className="input" placeholder={t('search.categoryPlaceholder')} value={filters.category} onChange={(event) => updateFilters({ category: event.target.value, page: 1 })} />
          </div>
          <div className="filter-group search-filter-group--compact">
            <span className="filter-bar__label">{t('search.lifecycleLabel')}</span>
            <select className="input input--select" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })}>
              <option value="">{t('search.anyStatus')}</option>
              <option value="Draft">{t('documents.statusDraft')}</option>
              <option value="InReview">{t('documents.statusInReview')}</option>
              <option value="Approved">{t('documents.statusApproved')}</option>
              <option value="Rejected">{t('documents.statusRejected')}</option>
              <option value="Archived">{t('documents.statusArchived')}</option>
            </select>
          </div>
          <button
            className="button button--secondary filter-action-button"
            type="button"
            onClick={() => updateFilters({ ...defaultFilters, page: 1 })}
            disabled={Object.entries(filters).every(([k, v]) => k === 'page' || k === 'pageSize' || v === '')}
          >
            {t('search.clearAll')}
          </button>
        </div>

        <div className="filter-chip-list">
          {filters.query && (
            <span className="filter-chip">
              <span className="filter-chip__label">{t('search.queryChip')}</span> {filters.query}
              <button className="filter-chip__remove" onClick={() => updateFilters({ query: '' })}>×</button>
            </span>
          )}
          {filters.category && (
            <span className="filter-chip">
              <span className="filter-chip__label">{t('search.categoryChip')}</span> {filters.category}
              <button className="filter-chip__remove" onClick={() => updateFilters({ category: '' })}>×</button>
            </span>
          )}
          {filters.status && (
            <span className="filter-chip">
              <span className="filter-chip__label">{t('search.statusChip')}</span> {filters.status}
              <button className="filter-chip__remove" onClick={() => updateFilters({ status: '' })}>×</button>
            </span>
          )}
          {filters.owner && (
            <span className="filter-chip">
              <span className="filter-chip__label">{t('search.ownerChip')}</span> {filters.owner}
              <button className="filter-chip__remove" onClick={() => updateFilters({ owner: '' })}>×</button>
            </span>
          )}
        </div>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}

      {(results?.items.length ?? 0) === 0 ? (
        <EmptyState 
          title={t('search.noResultsTitle')} 
          description={t('search.noResultsDescription')} 
        />
      ) : (
        <div className="registry-list">
          {results?.items.map((item) => (
            <article key={item.id} className="registry-item">
              <div className="registry-item__main">
                <div className="registry-item__header">
                  <div className="stack stack--compact">
                    <Link className="registry-item__title" to={`/documents/${item.id}`}>{item.title}</Link>
                    <p className="muted">{item.description ?? t('search.noDescription')}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="registry-meta">
                  <span className="status-pill status-pill--subtle">{item.category ?? t('documents.uncategorized')}</span>
                  <span>{t('search.currentVersionLabel', { value: item.currentVersionNumber ? `v${item.currentVersionNumber}` : t('documents.none') })}</span>
                  <span>{t('documents.ownerMeta', { value: item.ownerDisplayName ?? item.ownerUsername ?? t('documents.none') })}</span>
                  <span>{t('documents.controllerMeta', { value: item.controllerDisplayName ?? item.controllerUsername ?? t('documents.none') })}</span>
                </div>

                <div className="search-result-summary">
                  <div className="search-result-summary__item">
                    <strong>{item.signatureSummary.totalRequests}</strong>
                    <span>{t('search.signatureRequests')}</span>
                  </div>
                  <div className="search-result-summary__item">
                    <strong>{item.signatureSummary.signedCount}</strong>
                    <span>{t('search.signed')}</span>
                  </div>
                  <div className="search-result-summary__item">
                    <strong>{item.signatureSummary.pendingCount}</strong>
                    <span>{t('search.pending')}</span>
                  </div>
                  <div className="search-result-summary__item">
                    <strong>{item.signatureSummary.fullySigned ? t('search.yes') : t('search.no')}</strong>
                    <span>{t('search.fullySigned')}</span>
                  </div>
                </div>
              </div>

              <div className="registry-item__actions registry-item__actions--stack">
                <Link className="button" to={`/documents/${item.id}`}>{t('search.openDetail')}</Link>
                <Link className="button button--secondary" to="/audit-logs">{t('search.openAudit')}</Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="actions">
        <button className="button button--secondary" disabled={filters.page <= 1} type="button" onClick={() => updateFilters({ page: filters.page - 1 })}>
          {t('search.previous')}
        </button>
        <span className="muted">{t('search.pageOf', { page: filters.page, total: totalPages })}</span>
        <button className="button button--secondary" disabled={filters.page >= totalPages} type="button" onClick={() => updateFilters({ page: filters.page + 1 })}>
          {t('search.next')}
        </button>
      </div>
    </section>
  </div>
);
}
