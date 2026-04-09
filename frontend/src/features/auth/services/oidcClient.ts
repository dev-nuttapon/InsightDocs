import {
  authRequestTimeoutMs,
  keycloakClientId,
  keycloakScopes,
  keycloakAuthorizationEndpoint,
  keycloakLogoutEndpoint,
  keycloakTokenEndpoint,
  postLogoutRedirectUri,
  redirectUri,
} from '../config/authConfig';
import type { TokenSet } from '../context/authTypes';

const codeVerifierKey = 'insightdocs.auth.codeVerifier';
const stateKey = 'insightdocs.auth.state';
const returnToKey = 'insightdocs.auth.returnTo';
const tokensKey = 'insightdocs.auth.tokens';
const redirectInProgressKey = 'insightdocs.auth.redirectInProgress';

export type KeycloakTokens = TokenSet;
let inFlightCallbackPromise: Promise<KeycloakTokens> | null = null;

export async function beginLoginRedirect(returnTo?: string) {
  if (readTransientValue(redirectInProgressKey) === 'true') {
    return;
  }

  writeTransientValue(redirectInProgressKey, 'true');

  const state = crypto.randomUUID();
  const verifier = createRandomString();

  try {
    const challenge = await createCodeChallenge(verifier);

    writeTransientValue(codeVerifierKey, verifier);
    writeTransientValue(stateKey, state);
    writeTransientValue(returnToKey, returnTo ?? window.location.pathname);

    const url = new URL(keycloakAuthorizationEndpoint);
    url.searchParams.set('client_id', keycloakClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', keycloakScopes);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    window.location.assign(url.toString());
  } catch (error) {
    clearTransientValue(redirectInProgressKey);
    throw error;
  }
}

export async function completeAuthorizationCodeFlow(callbackUrl: string): Promise<KeycloakTokens> {
  if (inFlightCallbackPromise) {
    return inFlightCallbackPromise;
  }

  inFlightCallbackPromise = completeAuthorizationCodeFlowInternal(callbackUrl);

  try {
    return await inFlightCallbackPromise;
  } finally {
    inFlightCallbackPromise = null;
  }
}

async function completeAuthorizationCodeFlowInternal(callbackUrl: string): Promise<KeycloakTokens> {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const expectedState = readTransientValue(stateKey);
  const verifier = readTransientValue(codeVerifierKey);

  if (!code || !returnedState || !expectedState || returnedState !== expectedState || !verifier) {
    clearLoginRedirectState();
    throw new Error('The authentication response is missing required PKCE state.');
  }

  const body = new URLSearchParams({
    client_id: keycloakClientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await postFormWithTimeout(keycloakTokenEndpoint, body);

  if (!response.ok) {
    clearLoginRedirectState();
    throw new Error(`Token exchange failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
  };

  clearLoginRedirectState();

  return {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
  };
}

export async function buildLogoutRedirectUrl(idTokenHint?: string) {
  const url = new URL(keycloakLogoutEndpoint);
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
  url.searchParams.set('client_id', keycloakClientId);

  if (idTokenHint) {
    url.searchParams.set('id_token_hint', idTokenHint);
  }

  return url.toString();
}

export function readStoredTokens(): KeycloakTokens | null {
  const raw = sessionStorage.getItem(tokensKey) ?? localStorage.getItem(tokensKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as KeycloakTokens;
  } catch {
    sessionStorage.removeItem(tokensKey);
    localStorage.removeItem(tokensKey);
    return null;
  }
}

export function storeTokens(tokens: KeycloakTokens) {
  sessionStorage.setItem(tokensKey, JSON.stringify(tokens));
  localStorage.setItem(tokensKey, JSON.stringify(tokens));
}

export function removeStoredTokens() {
  sessionStorage.removeItem(tokensKey);
  localStorage.removeItem(tokensKey);
  clearLoginRedirectState();
}

export function consumeReturnTo() {
  const returnTo = readTransientValue(returnToKey) ?? '/';
  clearTransientValue(returnToKey);
  return returnTo;
}

export function resetLoginRedirectFlag() {
  clearTransientValue(redirectInProgressKey);
}

function createRandomString() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (value) => String.fromCharCode(value)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function clearLoginRedirectState() {
  clearTransientValue(codeVerifierKey);
  clearTransientValue(stateKey);
  clearTransientValue(redirectInProgressKey);
}

function writeTransientValue(key: string, value: string) {
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
}

function readTransientValue(key: string) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function clearTransientValue(key: string) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

async function postFormWithTimeout(url: string, body: URLSearchParams) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), authRequestTimeoutMs);

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: controller.signal,
    });
  } catch (error) {
    clearLoginRedirectState();

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Keycloak token exchange timed out after ${Math.floor(authRequestTimeoutMs / 1000)} seconds.`);
    }

    throw new Error('Unable to reach Keycloak token endpoint. Check VITE_KEYCLOAK_BASE_URL.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}
