import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { resetPassword } from '../api/authApi';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Password Reset</span>
        <h2>Set a new password</h2>
        <p className="muted">This reset token is one-time use and time-limited.</p>
      </div>

      {!token ? <div className="callout callout--danger">Missing reset token.</div> : null}
      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <form
        className="form-grid"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!token) {
            return;
          }

          setIsSubmitting(true);
          try {
            await resetPassword(token, password);
            setNotice('Password updated. You can now sign in with your new password.');
            setError(null);
            setPassword('');
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Password reset failed.');
            setNotice(null);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <input className="input" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="button" disabled={isSubmitting || !token} type="submit">{isSubmitting ? 'Updating...' : 'Reset Password'}</button>
      </form>

      <div className="actions">
        <Link className="button button--secondary" to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}
