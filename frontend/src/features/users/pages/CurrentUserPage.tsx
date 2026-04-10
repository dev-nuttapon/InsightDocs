import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/context/useAuth';
import { buildAccessProfile, formatRoleLabel } from '../../../shared/auth/authorization';

export function CurrentUserPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const access = buildAccessProfile(roles);

  return (
    <section className="stack stack--xl">
      <div className="panel panel--hero stack">
        <div className="section-heading">
          <span className="sidebar__eyebrow">User Information</span>
          <h2>My Profile</h2>
          <p className="muted">
            Review the identity claims and access scope that the current session exposes to the InsightDocs workspace.
          </p>
        </div>
        <div className="detail-grid">
          <article className="metric-panel metric-panel--left">
            <span className="card__label">Identity</span>
            <strong>{user?.username ?? 'Unavailable'}</strong>
            <span className="muted">{user?.email ?? 'No email claim'}</span>
            <span className="muted">Subject: {user?.subject ?? 'Unavailable'}</span>
          </article>
          <article className="metric-panel metric-panel--left">
            <span className="card__label">Access Scope</span>
            <strong>{access.normalizedRoles.length > 0 ? access.normalizedRoles.map(formatRoleLabel).join(', ') : 'No Keycloak roles'}</strong>
            <span className="muted">Approvals: {access.canReviewDocuments ? 'Enabled' : 'Not assigned'}</span>
            <span className="muted">Signatures: {access.canSignDocuments ? 'Enabled' : 'Not assigned'}</span>
            <span className="muted">Admin: {access.isAdmin ? 'Enabled' : 'Not assigned'}</span>
          </article>
        </div>
      </div>

      <div className="split-layout">
        <article className="panel stack">
          <div className="section-heading">
            <span className="sidebar__eyebrow">Documents</span>
            <h3>Open the governed workspace</h3>
          </div>
          <p className="muted">Move to the document registry to inspect records, open versions, and continue control work.</p>
          <div className="actions">
            <Link className="button" to="/documents">Open Documents</Link>
          </div>
        </article>

        {access.canReviewDocuments ? (
          <article className="panel stack">
            <div className="section-heading">
              <span className="sidebar__eyebrow">Approvals</span>
              <h3>Review pending work</h3>
            </div>
            <p className="muted">Open the approval queue assigned to your role and clear decisions from a single operational view.</p>
            <div className="actions">
              <Link className="button" to="/approvals">Open Approvals</Link>
            </div>
          </article>
        ) : (
          <article className="panel stack">
            <div className="section-heading">
              <span className="sidebar__eyebrow">Status</span>
              <h3>No approval queue assigned</h3>
            </div>
            <p className="muted">This account is authenticated, but there is no approval responsibility mapped to the current role set.</p>
          </article>
        )}
      </div>
    </section>
  );
}
