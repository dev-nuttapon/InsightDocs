import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { SampleDocumentsShowcase } from '../../../shared/components/mock/SampleDocumentsShowcase';
import { useTranslation } from '../../../i18n/useTranslation';
import { getDemoDocumentSummaries } from '../../../shared/mock/demoScenario';
import { isDemoModeEnabled } from '../../../shared/mock/demoMode';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import { createDocument, getDocuments } from '../api/documentsApi';
import type { CreateDocumentInput, DocumentStatus, DocumentSummary } from '../types';

export function DocumentsPage() {
  const { accessToken, user } = useAuth();
  const { language, t } = useTranslation();
  const demoMode = isDemoModeEnabled();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [form, setForm] = useState<CreateDocumentInput>({ title: '', description: '', category: '' });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const access = buildAccessProfile(user?.roles ?? []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (demoMode) {
        if (!ignore) {
          setDocuments(getDemoDocumentSummaries(language));
          setError(null);
        }
        return;
      }

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
  }, [accessToken, demoMode, language]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (demoMode) {
      const createdAt = new Date().toISOString();
      const created: DocumentSummary = {
        id: `demo-created-${Date.now()}`,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        category: form.category?.trim() || null,
        ownerUserId: null,
        ownerDisplayName: user?.displayName ?? user?.username ?? 'Current user',
        controllerUserId: null,
        controllerDisplayName: user?.displayName ?? user?.username ?? 'Current user',
        status: 'Draft',
        versionCount: 0,
        currentVersionNumber: null,
        createdAt,
        createdBy: user?.username ?? 'demo.user',
      };

      setDocuments((current) => [created, ...current]);
      setForm({ title: '', description: '', category: '' });
      setNotice(t('documents.createdDemo', { title: created.title }));
      setError(null);
      return;
    }

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
      setNotice(t('documents.createdLive', { title: created.title }));
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create document.');
      setNotice(null);
    }
  }

  const summaryCards = useMemo(() => [
    { label: t('documents.totalDocuments'), value: documents.length },
    { label: t('documents.draftDocuments'), value: documents.filter((document) => document.status === 'Draft').length },
    { label: t('documents.reviewDocuments'), value: documents.filter((document) => document.status === 'InReview').length },
    { label: t('documents.approvedDocuments'), value: documents.filter((document) => document.status === 'Approved').length },
  ], [documents, t]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        document.title.toLowerCase().includes(normalizedQuery) ||
        (document.description ?? '').toLowerCase().includes(normalizedQuery) ||
        (document.category ?? '').toLowerCase().includes(normalizedQuery) ||
        (document.ownerDisplayName ?? '').toLowerCase().includes(normalizedQuery) ||
        (document.controllerDisplayName ?? '').toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [documents, query, statusFilter]);

  const displayedDocuments = useMemo(() => {
    if (!demoMode || documents.length > 0) {
      return filteredDocuments;
    }

    return [];
  }, [demoMode, documents.length, filteredDocuments]);

  return (
    <div className="stack stack--xl">
      <PageHeader
        title={t('documents.title')}
        eyebrow={t('documents.eyebrow')}
        description={t('documents.description')}
        actions={<Link className="button button--secondary" to="/search">{t('common.advancedSearch')}</Link>}
      />

      <ModuleMockup
        eyebrow={t('documents.registryEyebrow')}
        title={t('documents.registryTitle')}
        description={t('documents.registryDescription')}
        highlights={t('documents.registryHighlights').split('|||')}
        steps={t('documents.registrySteps').split('|||')}
        metrics={[
          { label: t('documents.registrySectionEyebrow'), value: t('documents.registryMetricView') },
          { label: t('dashboard.focusNow'), value: access.canManageDocuments ? t('documents.registryMetricFlowManage') : t('documents.registryMetricFlowReview') },
        ]}
      />

      <SampleDocumentsShowcase />

      <div className="dashboard-summary-grid">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      {access.canManageDocuments ? (
        <section className="panel panel--full stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('documents.registerEyebrow')}</span>
            <h3>{t('documents.registerTitle')}</h3>
          </div>
          <div className="user-form-panel">
            <form className="stack" onSubmit={handleCreate}>
              <div className="grid-2">
                <label className="stack">
                  <span className="card__label">{t('documents.documentName')}</span>
                  <input
                    className="input"
                    placeholder={t('documents.documentNamePlaceholder')}
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="stack">
                  <span className="card__label">{t('documents.category')}</span>
                  <input
                    className="input"
                    placeholder={t('documents.categoryPlaceholder')}
                    value={form.category ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  />
                </label>
              </div>
              <label className="stack">
                <span className="card__label">{t('documents.descriptionField')}</span>
                <textarea
                  className="input textarea textarea--compact"
                  placeholder={t('documents.descriptionPlaceholder')}
                  value={form.description ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <div className="actions actions--compact">
                <button className="button" type="submit">{t('documents.createDocument')}</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">{t('documents.registrySectionEyebrow')}</span>
          <h3>{t('documents.registrySectionTitle')}</h3>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">{t('documents.searchLabel')}</span>
            <input
              className="input"
              placeholder={t('documents.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">{t('documents.statusLabel')}</span>
            <select
              className="input input--select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | DocumentStatus)}
            >
              <option value="all">{t('documents.allStatuses')}</option>
              <option value="Draft">{t('documents.statusDraft')}</option>
              <option value="InReview">{t('documents.statusInReview')}</option>
              <option value="Approved">{t('documents.statusApproved')}</option>
              <option value="Rejected">{t('documents.statusRejected')}</option>
              <option value="Archived">{t('documents.statusArchived')}</option>
            </select>
          </div>
        </div>

        <div className="registry-toolbar">
          <span className="muted">
            {t('documents.foundResults', { count: displayedDocuments.length, total: documents.length })}
          </span>
        </div>

        {displayedDocuments.length === 0 ? (
          <EmptyState
            title={t('documents.noDocumentsTitle')}
            description={t('documents.noDocumentsDescription')}
          />
        ) : (
          <div className="registry-list">
            {displayedDocuments.map((document) => (
              <article key={document.id} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${document.id}`}>
                        {document.title}
                      </Link>
                      <p className="muted">
                        {document.description || '-'}
                      </p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>

                  <div className="registry-meta">
                    <span className="status-pill status-pill--subtle">{document.category || '-'}</span>
                    <span>v{document.currentVersionNumber || 0}</span>
                    <span>{document.versionCount}</span>
                    <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="registry-meta">
                    <span>Owner: {document.ownerDisplayName || 'System'}</span>
                    <span>Controller: {document.controllerDisplayName || '-'}</span>
                  </div>
                </div>

                <div className="registry-item__actions">
                  <Link className="button button--secondary" to={`/documents/${document.id}`}>
                    {t('documents.openDocument')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
