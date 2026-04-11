import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { StatCard } from '../../../shared/components/ui/StatCard';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import { createDocument, getDocuments } from '../api/documentsApi';
import type { CreateDocumentInput, DocumentStatus, DocumentSummary } from '../types';

export function DocumentsPage() {
  const { accessToken, user } = useAuth();
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

  const summaryCards = useMemo(() => [
    { label: 'เอกสารทั้งหมด', value: documents.length },
    { label: 'ฉบับร่าง', value: documents.filter((document) => document.status === 'Draft').length },
    { label: 'รอตรวจสอบ', value: documents.filter((document) => document.status === 'InReview').length },
    { label: 'อนุมัติแล้ว', value: documents.filter((document) => document.status === 'Approved').length },
  ], [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

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

  return (
    <div className="stack stack--xl">
      <PageHeader
        title="Document Registry"
        eyebrow="Documents"
        description="ดูรายการเอกสารที่อยู่ภายใต้การควบคุม ค้นหาเอกสารที่ต้องใช้ และเปิดดูรายละเอียดเพื่อจัดการเวอร์ชัน อนุมัติ และลงนาม"
        actions={<Link className="button button--secondary" to="/search">ค้นหาเอกสารขั้นสูง</Link>}
      />

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
            <span className="sidebar__eyebrow">Register</span>
            <h3>ลงทะเบียนเอกสารใหม่</h3>
          </div>
          <div className="user-form-panel">
            <form className="stack" onSubmit={handleCreate}>
              <div className="grid-2">
                <label className="stack">
                  <span className="card__label">ชื่อเอกสาร</span>
                  <input
                    className="input"
                    placeholder="เช่น สัญญาจ้าง, ระเบียบการเงิน"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="stack">
                  <span className="card__label">หมวดหมู่</span>
                  <input
                    className="input"
                    placeholder="เช่น Legal, HR, Finance"
                    value={form.category ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  />
                </label>
              </div>
              <label className="stack">
                <span className="card__label">คำอธิบาย</span>
                <textarea
                  className="input textarea textarea--compact"
                  placeholder="สรุปวัตถุประสงค์หรือขอบเขตของเอกสารนี้"
                  value={form.description ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <div className="actions actions--compact">
                <button className="button" type="submit">สร้างรายการเอกสาร</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="panel panel--full stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">Registry</span>
          <h3>รายการเอกสาร</h3>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-bar__label">ค้นหาเอกสาร</span>
            <input
              className="input"
              placeholder="ค้นหาจากชื่อ คำอธิบาย หมวดหมู่ หรือผู้รับผิดชอบ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="filter-group">
            <span className="filter-bar__label">สถานะ</span>
            <select
              className="input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | DocumentStatus)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="Draft">Draft</option>
              <option value="InReview">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="registry-toolbar">
          <span className="muted">
            พบ {filteredDocuments.length} จาก {documents.length} รายการ
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <EmptyState
            title={documents.length === 0 ? 'ยังไม่มีเอกสาร' : 'ไม่พบเอกสารที่ตรงเงื่อนไข'}
            description={
              documents.length === 0
                ? 'เริ่มต้นด้วยการสร้างรายการเอกสารใหม่ แล้วค่อยอัปโหลดไฟล์ PDF ในหน้ารายละเอียด'
                : 'ลองเปลี่ยนคำค้นหรือสถานะที่เลือก เพื่อดูเอกสารรายการอื่น'
            }
          />
        ) : (
          <div className="registry-list">
            {filteredDocuments.map((document) => (
              <article key={document.id} className="registry-item">
                <div className="registry-item__main">
                  <div className="registry-item__header">
                    <div className="stack stack--compact">
                      <Link className="registry-item__title" to={`/documents/${document.id}`}>
                        {document.title}
                      </Link>
                      <p className="muted">
                        {document.description || 'ไม่มีคำอธิบายเอกสาร'}
                      </p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>

                  <div className="registry-meta">
                    <span className="status-pill status-pill--subtle">{document.category || 'ไม่ระบุหมวดหมู่'}</span>
                    <span>เวอร์ชันปัจจุบัน v{document.currentVersionNumber || 0}</span>
                    <span>ทั้งหมด {document.versionCount} เวอร์ชัน</span>
                    <span>สร้างเมื่อ {new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="registry-meta">
                    <span>Owner: {document.ownerDisplayName || 'System'}</span>
                    <span>Controller: {document.controllerDisplayName || '-'}</span>
                  </div>
                </div>

                <div className="registry-item__actions">
                  <Link className="button button--secondary" to={`/documents/${document.id}`}>
                    เปิดเอกสาร
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
