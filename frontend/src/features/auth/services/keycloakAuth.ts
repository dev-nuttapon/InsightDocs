import Keycloak from 'keycloak-js';

import { keycloakBaseUrl, keycloakClientId, keycloakRealm, keycloakScopes } from '../config/authConfig';

const keycloak = new Keycloak({
  url: keycloakBaseUrl,
  realm: keycloakRealm,
  clientId: keycloakClientId,
});

let initialized = false;
let initPromise: Promise<boolean> | null = null;

type AuthEventHandlers = {
  onAuthenticatedChanged?: (authenticated: boolean) => void;
  onTokenExpired?: () => void;
  onTokenRefreshed?: () => void;
};

export async function initKeycloak() {
  if (initialized) {
    return Boolean(keycloak.authenticated);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = keycloak
    .init({
      flow: 'standard',
      onLoad: 'check-sso',
      scope: keycloakScopes,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      checkLoginIframe: false,
      pkceMethod: 'S256',
    })
    .then((authenticated) => {
      initialized = true;
      return authenticated;
    })
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

export function bindAuthEvents(handlers: AuthEventHandlers) {
  keycloak.onAuthSuccess = () => {
    handlers.onAuthenticatedChanged?.(true);
  };
  keycloak.onAuthLogout = () => {
    handlers.onAuthenticatedChanged?.(false);
    handlers.onTokenExpired?.();
  };
  keycloak.onTokenExpired = () => {
    handlers.onTokenExpired?.();
  };
  keycloak.onAuthRefreshSuccess = () => {
    handlers.onTokenRefreshed?.();
  };
  keycloak.onAuthRefreshError = () => {
    handlers.onTokenExpired?.();
  };
}

export async function refreshToken(minValidity = 30) {
  try {
    if (!keycloak.authenticated) {
      return false;
    }

    return await keycloak.updateToken(minValidity);
  } catch {
    return false;
  }
}

export async function login(redirectPath = '/dashboard') {
  await keycloak.login({
    redirectUri: `${window.location.origin}${redirectPath}`,
  });
}

export async function logout() {
  await keycloak.logout({
    redirectUri: `${window.location.origin}/`,
  });
}

export async function getUserProfile() {
  if (!keycloak.authenticated) {
    return null;
  }

  return await keycloak.loadUserProfile();
}

export function getTokenParsed() {
  return keycloak.tokenParsed as Record<string, unknown> | undefined;
}

export function getAccessToken() {
  return keycloak.token;
}

export function isAuthenticated() {
  return Boolean(keycloak.authenticated);
}
