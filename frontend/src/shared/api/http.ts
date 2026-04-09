import { apiBaseUrl, authRequestTimeoutMs } from '../../features/auth/config/authConfig';
import { cookieSessionToken } from '../../features/auth/context/authTypes';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type RequestOptions = {
  accessToken?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  includeCredentials?: boolean;
  method?: string;
  timeoutMs?: number;
};

export async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  return requestJson<T>(path, { ...options, method: options?.method ?? 'GET' });
}

export async function postJson<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return requestJson<T>(path, { ...options, body, method: 'POST' });
}

export async function putJson<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return requestJson<T>(path, { ...options, body, method: 'PUT' });
}

export async function deleteRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  return requestJson<T>(path, { ...options, method: 'DELETE' });
}

export async function requestJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await request(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export async function request(path: string, options?: RequestOptions): Promise<Response> {
  const response = await requestWithTimeout(`${apiBaseUrl}${path}`, {
    method: options?.method,
    body: serializeBody(options?.body, options?.headers),
    credentials: options?.includeCredentials ?? true ? 'include' : 'same-origin',
    headers: buildHeaders(options),
  }, options?.timeoutMs ?? authRequestTimeoutMs);

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }

  return response;
}

async function requestWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.floor(timeoutMs / 1000)} seconds.`);
    }

    throw new Error('Unable to reach the API. Check that InsightDocs backend is running and VITE_API_BASE_URL is correct.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildHeaders(options?: RequestOptions) {
  const headers = new Headers(options?.headers);
  const accessToken = options?.accessToken;

  if (options?.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && accessToken !== cookieSessionToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

function serializeBody(body: unknown, headers?: HeadersInit) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData) {
    return body;
  }

  const normalizedHeaders = new Headers(headers);
  const contentType = normalizedHeaders.get('Content-Type');

  if (!contentType || contentType.includes('application/json')) {
    return JSON.stringify(body);
  }

  return body as BodyInit;
}
