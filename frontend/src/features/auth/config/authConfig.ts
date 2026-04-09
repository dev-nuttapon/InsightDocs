function readEnv(name: keyof ImportMetaEnv, fallback: string) {
  const value = import.meta.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const apiBaseUrl = readEnv('VITE_API_BASE_URL', 'http://localhost:8081');
export const keycloakBaseUrl = readEnv('VITE_KEYCLOAK_BASE_URL', import.meta.env.VITE_KEYCLOAK_URL ?? 'http://auth.localhost');
export const keycloakRealm = readEnv('VITE_KEYCLOAK_REALM', 'saas');
export const keycloakClientId = readEnv('VITE_KEYCLOAK_CLIENT_ID', 'insightdocs-web');
export const keycloakScopes = import.meta.env.VITE_KEYCLOAK_SCOPES || 'openid profile email';
export const redirectUri = new URL('/auth/callback', window.location.origin).toString();
export const postLogoutRedirectUri = new URL('/login', window.location.origin).toString();
export const keycloakAuthorizationEndpoint = `${keycloakBaseUrl.replace(/\/$/, '')}/realms/${keycloakRealm}/protocol/openid-connect/auth`;
export const keycloakTokenEndpoint = `${keycloakBaseUrl.replace(/\/$/, '')}/realms/${keycloakRealm}/protocol/openid-connect/token`;
export const keycloakLogoutEndpoint = `${keycloakBaseUrl.replace(/\/$/, '')}/realms/${keycloakRealm}/protocol/openid-connect/logout`;
export const authRequestTimeoutMs = 10000;
