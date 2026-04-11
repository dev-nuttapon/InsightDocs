import { useState } from 'react';
import { Link } from 'react-router-dom';

import { createForgotPasswordRequest } from '../api/authApi';

export function ForgotPasswordPage() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-view">
      <div className="auth-card stack">
        <div className="auth-header">
          <div className="auth-brand">ID</div>
          <h2 className="auth-title">Password Reset</h2>
          <p className="muted">An Admin will review your request and manually provide a secure reset link.</p>
        </div>

        {error ? <div className="callout callout--danger">{error}</div> : null}
        {notice ? <div className="callout">{notice}</div> : null}

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            try {
              await createForgotPasswordRequest(value);
              setNotice('Password reset request submitted for Admin review.');
              setError(null);
              setValue('');
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : 'Unable to create reset request.');
              setNotice(null);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="stack">
            <span className="card__label">Account Email</span>
            <input 
              className="input input--large" 
              placeholder="name@organization.com" 
              type="email" 
              value={value} 
              onChange={(event) => setValue(event.target.value)} 
              required
            />
          </div>
          <button className="button button--large" disabled={isSubmitting} type="submit" style={{ marginTop: '12px' }}>
            {isSubmitting ? 'Submitting Request...' : 'Request Reset Link'}
          </button>
        </form>

        <div className="actions" style={{ justifyContent: 'center', marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
          <Link className="button button--secondary" to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
