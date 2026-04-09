import { startTransition, useEffect, useState, type ReactNode } from 'react';

import { getCurrentUser } from '../api/authApi';
import {
  beginLoginRedirect,
  buildLogoutRedirectUrl,
  completeAuthorizationCodeFlow,
  readStoredTokens,
  removeStoredTokens,
  storeTokens,
  type KeycloakTokens,
} from '../services/oidcClient';
import { AuthContext } from './AuthContext';
import type { CurrentUser } from './authTypes';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      const storedTokens = readStoredTokens();

      if (!storedTokens) {
        if (!ignore) {
          setIsLoading(false);
        }
        return;
      }

      if (storedTokens.expiresAt <= Date.now()) {
        removeStoredTokens();

        if (!ignore) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUser(storedTokens.accessToken);

        if (!ignore) {
          startTransition(() => {
            setAccessToken(storedTokens.accessToken);
            setUser(profile);
            setError(null);
            setIsLoading(false);
          });
        }
      } catch (bootstrapError) {
        removeStoredTokens();

        if (!ignore) {
          setAccessToken(null);
          setUser(null);
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'Unable to restore authentication state.');
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, []);

  async function login(returnTo?: string) {
    setError(null);
    await beginLoginRedirect(returnTo);
  }

  async function completeLoginCallback(callbackUrl: string) {
    setIsLoading(true);
    setError(null);

    try {
      const tokens = await completeAuthorizationCodeFlow(callbackUrl);
      const profile = await applyAuthenticatedSession(tokens);

      startTransition(() => {
        setUser(profile);
        setAccessToken(tokens.accessToken);
        setIsLoading(false);
      });
    } catch (callbackError) {
      removeStoredTokens();
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      setError(callbackError instanceof Error ? callbackError.message : 'Authentication callback failed.');
      throw callbackError;
    }
  }

  async function logout() {
    const storedTokens = readStoredTokens();
    removeStoredTokens();
    setAccessToken(null);
    setUser(null);
    setError(null);

    const logoutUrl = await buildLogoutRedirectUrl(storedTokens?.idToken);
    window.location.assign(logoutUrl);
  }

  async function applyAuthenticatedSession(tokens: KeycloakTokens) {
    storeTokens(tokens);
    const profile = await getCurrentUser(tokens.accessToken);
    return profile;
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        error,
        isAuthenticated: Boolean(accessToken && user),
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
