import { useState } from 'react';
import { Link } from 'react-router-dom';

import { createForgotPasswordRequest } from '../api/authApi';

export function ForgotPasswordPage() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="panel stack">
      <div>
        <span className="sidebar__eyebrow">Password Reset</span>
        <h2>Request a password reset</h2>
        <p className="muted">An Admin reviews your request, approves or rejects it, then manually sends the generated reset link. Use your email address as the username.</p>
      </div>

      {error ? <div className="callout callout--danger">{error}</div> : null}
      {notice ? <div className="callout">{notice}</div> : null}

      <form
        className="form-grid"
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
        <input className="input" placeholder="Email" type="email" value={value} onChange={(event) => setValue(event.target.value)} />
        <button className="button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Submitting...' : 'Request Reset'}</button>
      </form>

      <div className="actions">
        <Link className="button button--secondary" to="/login">Back to sign in</Link>
      </div>
    </section>
  );
}
