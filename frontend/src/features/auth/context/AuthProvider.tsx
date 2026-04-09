import { useEffect, useState, type ReactNode } from 'react';

import { apiBaseUrl } from '../config/authConfig';
import { getCurrentUser } from '../api/authApi';
import {
  beginLoginRedirect,
  completeAuthorizationCodeFlow,
  removeStoredTokens,
} from '../services/oidcClient';
import { AuthContext } from './AuthContext';
import { cookieSessionToken, type AuthState, type CurrentUser } from './authTypes';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const isCallbackRoute = window.location.pathname === '/auth/callback';

    if (isCallbackRoute) {
      setAuthState('anonymous');
      setError(null);
      return () => {
        ignore = true;
      };
    }

    async function restoreSession() {
      try {
        const profile = await getCurrentUser();

        if (!ignore) {
          setAccessToken(cookieSessionToken);
          setAuthState('authenticated');
          setUser(profile);
          setError(null);
        }
      } catch (bootstrapError) {
        removeStoredTokens();

        if (!ignore) {
          setAccessToken(null);
          setAuthState(resolveAnonymousState(bootstrapError));
          setUser(null);
          setError(readErrorMessage(bootstrapError, 'Unable to restore authentication state.'));
        }
      }
    }

    void restoreSession();

    return () => {
      ignore = true;
    };
  }, []);

  async function login(returnTo?: string) {
    setError(null);
    setAuthState('anonymous');
    await beginLoginRedirect(returnTo);
  }

  async function completeLoginCallback(callbackUrl: string) {
    setAuthState('loading');
    setError(null);

    try {
      await completeAuthorizationCodeFlow(callbackUrl);
      const profile = await restoreAuthenticatedSession();

      setUser(profile);
      setAccessToken(cookieSessionToken);
      setAuthState('authenticated');
    } catch (callbackError) {
      removeStoredTokens();
      setAccessToken(null);
      setAuthState(resolveAnonymousState(callbackError));
      setUser(null);
      setError(readErrorMessage(callbackError, 'Authentication callback failed.'));
      throw callbackError;
    }
  }

  async function logout() {
    removeStoredTokens();
    setAccessToken(null);
    setAuthState('anonymous');
    setUser(null);
    setError(null);

    const logoutUrl = new URL('/api/auth/logout', apiBaseUrl);
    logoutUrl.searchParams.set('postLogoutRedirectUri', new URL('/login', window.location.origin).toString());
    window.location.assign(logoutUrl.toString());
  }

  async function restoreAuthenticatedSession() {
    const profile = await getCurrentUser();
    return profile;
  }

  const isReady = authState !== 'loading';
  const isAuthenticated = authState === 'authenticated' && Boolean(accessToken && user);
  const isLoading = authState === 'loading';

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        authState,
        error,
        isAuthenticated,
        isReady,
        isLoading,
        user,
        login,
        logout,
        completeLoginCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function resolveAnonymousState(error: unknown): AuthState {
  const message = readErrorMessage(error, '').toLowerCase();
  return message.includes('timed out') ? 'expired' : 'anonymous';
}
