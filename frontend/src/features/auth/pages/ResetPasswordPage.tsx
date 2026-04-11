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
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">New Password</h2>
          <p className="muted">Enter a strong password to secure your account. This link is single-use only.</p>
        </div>

        {!token ? <div className="callout callout--danger">Missing secure reset token.</div> : null}
        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!token) return;

            setIsSubmitting(true);
            try {
              await resetPassword(token, password);
              setNotice('Password updated successfully. You may now sign in.');
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
          <div className="stack">
            <span className="card__label">New Password</span>
            <input 
              className="input input--large" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              required
              disabled={!token}
            />
          </div>
          <button className="button button--large" disabled={isSubmitting || !token} type="submit" style={{ marginTop: '12px' }}>
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="actions" style={{ justifyContent: 'center', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
          <Link className="button button--secondary" to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
