import { useEffect, useState, type ReactNode } from 'react';

import { getCurrentUser } from '../api/authApi';
import {
  bindAuthEvents,
  getAccessToken,
  getTokenParsed,
  getUserProfile,
  initKeycloak,
  isAuthenticated as keycloakIsAuthenticated,
  login,
  logout,
  refreshToken,
} from '../services/keycloakAuth';
import { AuthContext } from './AuthContext';
import type { AuthContextValue, CurrentUser } from './authTypes';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextValue>({
    accessToken: null,
    authState: 'loading',
    error: null,
    isAuthenticated: false,
    isReady: false,
    isLoading: true,
    user: null,
    login,
    logout,
  });

  useEffect(() => {
    let mounted = true;
    let refreshTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

    const setAnonymous = (authState: AuthContextValue['authState'] = 'anonymous', error: string | null = null) => {
      if (!mounted) {
        return;
      }

      setState({
        accessToken: null,
        authState,
        error,
        isAuthenticated: false,
        isReady: true,
        isLoading: false,
        user: null,
        login,
        logout,
      });
    };

    const stopRefreshLoop = () => {
      if (!refreshTimeoutId) {
        return;
      }

      window.clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    };

    const getTokenRefreshDelayMs = () => {
      const tokenParsed = getTokenParsed() as { exp?: number } | undefined;
      if (!tokenParsed?.exp) {
        return 30000;
      }

      const expiresAtMs = tokenParsed.exp * 1000;
      const refreshAtMs = expiresAtMs - 60000;
      return Math.max(5000, refreshAtMs - Date.now());
    };

    const buildFallbackUser = async (): Promise<CurrentUser | null> => {
      const tokenParsed = getTokenParsed();
      if (!tokenParsed) {
        return null;
      }

      try {
        const profile = await getUserProfile();

        return {
          subject: typeof tokenParsed.sub === 'string' ? tokenParsed.sub : null,
          username:
            profile?.username ??
            (typeof tokenParsed.preferred_username === 'string' ? tokenParsed.preferred_username : null),
          email: profile?.email ?? (typeof tokenParsed.email === 'string' ? tokenParsed.email : null),
          roles: extractRoles(tokenParsed),
        };
      } catch {
        return {
          subject: typeof tokenParsed.sub === 'string' ? tokenParsed.sub : null,
          username: typeof tokenParsed.preferred_username === 'string' ? tokenParsed.preferred_username : null,
          email: typeof tokenParsed.email === 'string' ? tokenParsed.email : null,
          roles: extractRoles(tokenParsed),
        };
      }
    };

    const buildUser = async (): Promise<CurrentUser | null> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        return await buildFallbackUser();
      }

      try {
        return await getCurrentUser(accessToken);
      } catch {
        return await buildFallbackUser();
      }
    };

    const updateAuthState = async (authenticated: boolean) => {
      if (!mounted) {
        return;
      }

      if (!authenticated) {
        stopRefreshLoop();
        setAnonymous();
        return;
      }

      const accessToken = getAccessToken() ?? null;
      const user = await buildUser();

      if (!mounted) {
        return;
      }

      setState({
        accessToken,
        authState: 'authenticated',
        error: null,
        isAuthenticated: Boolean(accessToken),
        isReady: true,
        isLoading: false,
        user,
        login,
        logout,
      });

      stopRefreshLoop();
      refreshTimeoutId = window.setTimeout(() => {
        void ensureFreshSession(60);
      }, getTokenRefreshDelayMs());
    };

    const ensureFreshSession = async (minValidity = 60) => {
      const refreshed = await refreshToken(minValidity);
      if (!refreshed && !keycloakIsAuthenticated()) {
        stopRefreshLoop();
        setAnonymous('expired', 'Your session expired. Please sign in again.');
        return;
      }

      if (keycloakIsAuthenticated()) {
        void updateAuthState(true);
      }
    };

    bindAuthEvents({
      onAuthenticatedChanged: (authenticated) => {
        void updateAuthState(authenticated);
      },
      onTokenExpired: () => {
        void ensureFreshSession(0);
      },
      onTokenRefreshed: () => {
        void updateAuthState(true);
      },
    });

    const onWindowFocus = () => {
      void ensureFreshSession();
    };
    window.addEventListener('focus', onWindowFocus);

    initKeycloak()
      .then((authenticated) => {
        void updateAuthState(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak init failed:', error);
        setAnonymous('expired', 'Unable to initialize Keycloak session.');
      });

    return () => {
      mounted = false;
      stopRefreshLoop();
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

function extractRoles(tokenParsed: Record<string, unknown>) {
  const roles = new Set<string>();

  const realmAccess = tokenParsed.realm_access as { roles?: unknown } | undefined;
  if (Array.isArray(realmAccess?.roles)) {
    for (const role of realmAccess.roles) {
      if (typeof role === 'string' && role.trim()) {
        roles.add(role);
      }
    }
  }

  const resourceAccess = tokenParsed.resource_access as Record<string, { roles?: unknown } | undefined> | undefined;
  if (resourceAccess) {
    for (const resource of Object.values(resourceAccess)) {
      if (!Array.isArray(resource?.roles)) {
        continue;
      }

      for (const role of resource.roles) {
        if (typeof role === 'string' && role.trim()) {
          roles.add(role);
        }
      }
    }
  }

  return Array.from(roles);
}
