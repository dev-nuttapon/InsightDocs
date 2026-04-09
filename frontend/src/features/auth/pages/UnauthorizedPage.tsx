import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <section className="panel">
      <span className="sidebar__eyebrow">Authorization</span>
      <h2>Access denied</h2>
      <p className="muted">
        Your account is authenticated, but it does not currently have the required role or policy for this action.
      </p>
      <div className="actions">
        <Link className="button" to="/">Return to dashboard</Link>
        <Link className="button button--secondary" to="/login">Switch account</Link>
      </div>
    </section>
  );
}
