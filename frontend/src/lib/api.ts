const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Extracts Django's CSRF token from document.cookie
 */
export function getCSRFToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match?.[1] ?? '';
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

/**
 * Central HTTP client with CSRF token management and same-origin cookie credentials.
 * Connects to the Django REST Framework backend.
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, headers, ...restOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  let csrfToken = getCSRFToken();
  if (!['GET', 'HEAD', 'OPTIONS'].includes((restOptions.method || 'GET').toUpperCase()) && !csrfToken) {
    const bootstrap = await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'same-origin', signal: AbortSignal.timeout(10000) });
    if (!bootstrap.ok) throw new ApiError(bootstrap.status, bootstrap.statusText, null);
    csrfToken = (await bootstrap.json()).csrfToken;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    credentials: 'same-origin',
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown = {}, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body: unknown = {}, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body: unknown = {}, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
