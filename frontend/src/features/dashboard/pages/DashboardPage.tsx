import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { StatePanel } from '../../../shared/components/state/StatePanel';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { StatCard } from '../../../shared/components/ui/StatCard';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { ModuleMockup } from '../../../shared/components/mock/ModuleMockup';
import { SampleDocumentsShowcase } from '../../../shared/components/mock/SampleDocumentsShowcase';
import { SAMPLE_DOCUMENTS } from '../../../shared/mock/sampleDocuments';
import { buildAccessProfile } from '../../../shared/auth/authorization';
import { useAuth } from '../../auth/context/useAuth';
import {
  getDashboardSummary,
  getRecentDashboardActivities,
  getRecentDashboardDocuments,
} from '../api/dashboardApi';
import type {
  DashboardSummary,
  RecentDashboardActivity,
  RecentDashboardDocument,
} from '../types';

export function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDashboardDocument[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentDashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      if (!accessToken) {
        return;
      }

      try {
        const [summaryPayload, documentsPayload, activitiesPayload] = await Promise.all([
          getDashboardSummary(accessToken),
          getRecentDashboardDocuments(accessToken),
          getRecentDashboardActivities(accessToken),
        ]);

        if (!ignore) {
          setSummary(summaryPayload);
          setRecentDocuments(documentsPayload);
          setRecentActivities(activitiesPayload);
          setError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  const quickActions = useMemo(() => {
    const actions = [];

    if (access.canManageDocuments) {
      actions.push({
        to: '/documents',
        label: 'จัดการเอกสาร',
        description: 'สร้าง อัปโหลดเวอร์ชันใหม่ แก้ไขข้อมูล และดูสถานะเอกสารล่าสุด',
      });
    } else {
      actions.push({
        to: '/documents',
        label: 'เปิดรายการเอกสาร',
        description: 'ดูเอกสารล่าสุดและสถานะที่เกี่ยวข้องกับงานของคุณ',
      });
    }

    actions.push({
      to: '/search',
      label: 'ค้นหาเอกสาร',
      description: 'ค้นหาด้วยคำสำคัญ หมวดหมู่ สถานะ และข้อมูลอ้างอิงอื่น ๆ',
    });

    if (access.canReviewDocuments) {
      actions.push({
        to: '/approvals',
        label: 'ตรวจสอบรายการรออนุมัติ',
        description: 'เปิดคิวอนุมัติเอกสารที่รอการพิจารณาและดำเนินการต่อได้ทันที',
      });
    }

    if (access.canSignDocuments) {
      actions.push({
        to: '/signatures',
        label: 'ตรวจสอบรายการรอลงนาม',
        description: 'เปิดคิวลงนามที่ได้รับมอบหมายและดำเนินการลงนามตามลำดับงาน',
      });
    }

    if (access.isAdmin) {
      actions.push(
        {
          to: '/users',
          label: 'จัดการผู้ใช้งาน',
          description: 'ดูสถานะผู้ใช้งาน กำหนดสิทธิ์ และจัดการการเข้าถึงระบบ',
        },
        {
          to: '/audit-logs',
          label: 'ตรวจสอบ Audit Log',
          description: 'ติดตามเหตุการณ์สำคัญของระบบสำหรับการตรวจสอบย้อนหลัง',
        },
      );
    }

    return actions.slice(0, 4);
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin]);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    const cards = [];

    if (access.canReviewDocuments) {
      cards.push({ label: 'รออนุมัติ', value: summary.pendingApprovals });
    }

    if (access.canSignDocuments) {
      cards.push({ label: 'รอลงนาม', value: summary.pendingSignatures });
    }

    cards.push({ label: 'เอกสารทั้งหมด', value: summary.totalDocuments });
    cards.push({ label: 'อนุมัติแล้ว', value: summary.approvedDocuments });

    if (access.canManageDocuments || access.isAdmin) {
      cards.push({ label: 'เก็บถาวร', value: summary.archivedDocuments });
    }

    return cards.slice(0, 4);
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments, access.isAdmin, summary]);

  const primaryHeading = useMemo(() => {
    if (access.canReviewDocuments) {
      return {
        title: 'งานอนุมัติเอกสาร',
        description: 'เห็นคิวงานอนุมัติและรายการเอกสารล่าสุดที่ต้องติดตามจากจุดเดียว',
      };
    }

    if (access.canSignDocuments) {
      return {
        title: 'งานลงนามเอกสาร',
        description: 'ติดตามคิวลงนามและสถานะเอกสารที่เกี่ยวข้องกับการดำเนินการของคุณ',
      };
    }

    if (access.canManageDocuments) {
      return {
        title: 'งานจัดการเอกสาร',
        description: 'เข้าถึงงานอัปโหลด แก้ไข ค้นหา และติดตามสถานะเอกสารที่กำลังดำเนินการ',
      };
    }

    return {
      title: 'ภาพรวมเอกสาร',
      description: 'ดูรายการเอกสารล่าสุดและเข้าถึงการค้นหาเอกสารที่เกี่ยวข้องกับงานของคุณ',
    };
  }, [access.canManageDocuments, access.canReviewDocuments, access.canSignDocuments]);

  const displayedRecentDocuments = useMemo(() => {
    if (recentDocuments.length > 0) {
      return recentDocuments;
    }

    return SAMPLE_DOCUMENTS.map((document, index) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      status: document.status,
      currentVersionNumber: Number(document.currentVersion.replace('v', '')),
      ownerDisplayName: document.owner,
      controllerDisplayName: document.controller,
      lastActivityAt: new Date(Date.now() - index * 3600000).toISOString(),
    }));
  }, [recentDocuments]);

  const displayedRecentActivities = useMemo(() => {
    if (recentActivities.length > 0) {
      return recentActivities;
    }

    return SAMPLE_DOCUMENTS.map((document, index) => ({
      id: `mock-activity-${document.id}`,
      action: document.status === 'Approved' ? 'document.approval.approved' : document.status === 'InReview' ? 'document.approval.submitted' : 'document.created',
      entityType: 'Document',
      entityId: document.id,
      relatedDocumentId: document.id,
      relatedVersionId: document.currentVersion,
      relatedDocumentTitle: document.title,
      actorDisplayName: document.controller,
      actorUsername: null,
      timestamp: new Date(Date.now() - index * 5400000).toISOString(),
    }));
  }, [recentActivities]);

  if (!summary && !error) {
    return <StatePanel eyebrow="Dashboard" title="Loading dashboard" description="Collecting current metrics, recent documents, and operational activity." busy />;
  }

  return (
    <section className="stack stack--xl">
      <PageHeader
        title={primaryHeading.title}
        eyebrow="Operational Dashboard"
        description={primaryHeading.description}
      />

      <ModuleMockup
        eyebrow="Dashboard Mockup"
        title="ศูนย์ควบคุมภาพรวมงานเอกสาร"
        description="ใช้หน้านี้เป็นจุดเริ่มต้นสำหรับดูสถานะงานรายวัน เห็นคิวที่ต้องทำต่อ เอกสารล่าสุด และกิจกรรมสำคัญในภาพเดียว"
        highlights={['ภาพรวมรายวัน', 'งานเร่งด่วน', 'คิวรออนุมัติ/ลงนาม', 'เอกสารล่าสุด']}
        steps={[
          'เปิดดู metric สำคัญของบทบาทที่คุณรับผิดชอบ',
          'เลือกงานที่ต้องดำเนินการต่อจาก Quick Actions',
          'ตรวจเอกสารล่าสุดและกิจกรรมที่เพิ่งเกิดขึ้น',
        ]}
        metrics={[
          { label: 'บทบาทการใช้งาน', value: access.isAdmin ? 'Admin Workspace' : access.canReviewDocuments ? 'Review Workspace' : access.canSignDocuments ? 'Signature Workspace' : 'General Workspace' },
          { label: 'โฟกัสหลัก', value: access.canReviewDocuments ? 'Approvals' : access.canSignDocuments ? 'Signing Queue' : 'Document Operations' },
        ]}
      />

      <SampleDocumentsShowcase />

      {error ? <div className="callout callout--danger">{error}</div> : null}

      {summaryCards.length > 0 ? (
        <div className="panel panel--hero stack">
          <div className="dashboard-summary-grid dashboard-summary-grid--hero">
            {summaryCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="split-layout">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Quick Actions</span>
            <h3>งานที่ควรทำต่อ</h3>
          </div>
          <div className="action-list">
            {quickActions.map((action) => (
              <div key={action.to} className="action-row">
                <div className="action-row__copy">
                  <strong>{action.label}</strong>
                  <span className="muted">{action.description}</span>
                </div>
                <Link className="button" to={action.to}>Open</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Focus</span>
            <h3>สิ่งที่ควรติดตามตอนนี้</h3>
          </div>
          <div className="action-list">
            {access.canReviewDocuments ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>คิวอนุมัติ</strong>
                  <span className="muted">มีเอกสารรออนุมัติ {summary?.pendingApprovals ?? 0} รายการ</span>
                </div>
                <Link className="button button--secondary" to="/approvals">Open</Link>
              </div>
            ) : null}
            {access.canSignDocuments ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>คิวลงนาม</strong>
                  <span className="muted">มีรายการรอลงนาม {summary?.pendingSignatures ?? 0} รายการ</span>
                </div>
                <Link className="button button--secondary" to="/signatures">Open</Link>
              </div>
            ) : null}
            <div className="action-row">
              <div className="action-row__copy">
                <strong>ค้นหาเอกสาร</strong>
                <span className="muted">เข้าถึงเอกสารที่ต้องใช้ได้รวดเร็วผ่านตัวกรองและคำค้น</span>
              </div>
              <Link className="button button--secondary" to="/search">Open</Link>
            </div>
            {access.isAdmin ? (
              <div className="action-row">
                <div className="action-row__copy">
                  <strong>จัดการผู้ใช้งาน</strong>
                  <span className="muted">ดูผู้ใช้ ปรับสิทธิ์ และตรวจสอบการเข้าถึงระบบ</span>
                </div>
                <Link className="button button--secondary" to="/users">Open</Link>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="split-layout split-layout--wide">
        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Documents</span>
            <h3>เอกสารล่าสุด</h3>
          </div>
          <div className="table-wrap">
            <table className="table table--premium">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecentDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <Link to={`/documents/${document.id}`} style={{ fontWeight: 700 }}>{document.title}</Link>
                      <div className="muted" style={{ fontSize: '11px' }}>{document.category ?? 'Uncategorized'}</div>
                    </td>
                    <td>
                      <StatusBadge status={document.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>v{document.currentVersionNumber || '1'}</div>
                      <div className="muted" style={{ fontSize: '11px' }}>{new Date(document.lastActivityAt).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
                {displayedRecentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState 
                        title="No documents" 
                        description="There are no documents in the system yet." 
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Recent Activities</span>
            <h3>กิจกรรมล่าสุด</h3>
          </div>
          {displayedRecentActivities.length === 0 ? (
            <EmptyState 
              title="No activity" 
              description="Recent operational events will appear here." 
            />
          ) : (
            <div className="timeline" style={{ padding: '8px' }}>
              {displayedRecentActivities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-item__dot" />
                  <div className="timeline-item__content">
                    <div className="timeline-item__time">{new Date(activity.timestamp).toLocaleTimeString()}</div>
                    <div className="timeline-item__label">{activity.action}</div>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {activity.relatedDocumentId ? (
                        <Link to={`/documents/${activity.relatedDocumentId}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          {activity.relatedDocumentTitle ?? 'Open document'}
                        </Link>
                      ) : (
                        activity.entityType
                      )}
                      {" • "}
                      {activity.actorDisplayName ?? activity.actorUsername ?? 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
