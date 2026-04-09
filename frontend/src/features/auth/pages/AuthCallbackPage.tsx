import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { consumeReturnTo } from '../services/oidcClient';

const callbackTimeoutMs = 12000;

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeLoginCallback } = useAuth();
  const [message, setMessage] = useState('Finalizing your session...');
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }

    hasHandledCallback.current = true;
    let ignore = false;

    async function handleCallback() {
      try {
        await completeLoginCallbackWithTimeout(completeLoginCallback, window.location.href);
        const returnTo = consumeReturnTo();

        if (!ignore) {
          window.location.replace(returnTo);
        }
      } catch (error) {
        if (!ignore) {
          const errorMessage = error instanceof Error ? error.message : 'Unable to complete sign-in.';
          setMessage(errorMessage);

          const returnTo = consumeReturnTo();
          navigate('/login', {
            replace: true,
            state: {
              from: returnTo,
              errorMessage,
            },
          });
        }
      }
    }

    void handleCallback();

    return () => {
      ignore = true;
    };
  }, [completeLoginCallback, navigate]);

  return (
    <section className="panel">
      <span className="sidebar__eyebrow">OIDC Callback</span>
      <h2>Completing authentication</h2>
      <p className="muted">{message}</p>
    </section>
  );
}

async function completeLoginCallbackWithTimeout(
  completeLoginCallback: (callbackUrl: string) => Promise<void>,
  callbackUrl: string,
) {
  return await Promise.race([
    completeLoginCallback(callbackUrl),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Authentication callback timed out. Please try signing in again.')), callbackTimeoutMs);
    }),
  ]);
}
