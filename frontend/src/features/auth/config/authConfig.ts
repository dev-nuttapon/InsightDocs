function readEnv(name: keyof ImportMetaEnv, fallback: string) {
  const value = import.meta.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const apiBaseUrl = readEnv('VITE_API_BASE_URL', 'http://localhost:8082');
export const keycloakBaseUrl = readEnv('VITE_KEYCLOAK_BASE_URL', import.meta.env.VITE_KEYCLOAK_URL ?? 'http://auth.localhost');
export const keycloakRealm = readEnv('VITE_KEYCLOAK_REALM', 'saas');
export const keycloakClientId = readEnv('VITE_KEYCLOAK_CLIENT_ID', 'insightdocs-web');
export const keycloakScopes = import.meta.env.VITE_KEYCLOAK_SCOPES || 'openid profile email';
export const authRequestTimeoutMs = 10000;
export const keycloakSessionCheckTimeoutMs = Number(import.meta.env.VITE_KEYCLOAK_SESSION_CHECK_TIMEOUT_MS ?? '2500');

export const keycloakAccountConsoleUrl = `${keycloakBaseUrl.replace(/\/$/, '')}/realms/${keycloakRealm}/account`;
