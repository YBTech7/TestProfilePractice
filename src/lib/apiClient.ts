const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  isStaticFallback: boolean;

  constructor(message: string, status = 500, isStaticFallback = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isStaticFallback = isStaticFallback;
  }
}

export function getApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${RAW_API_BASE}${normalized}`;
}

export function isExternalApiConfigured(): boolean {
  return RAW_API_BASE.length > 0;
}

export function isStaticHostWithoutApi(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('github.io') && !isExternalApiConfigured();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  if (isStaticHostWithoutApi()) {
    throw new ApiError(
      'This static GitHub Pages site does not have a live backend URL configured. Direct inquiries can be sent to pioorly.languisan@gmail.com.',
      503,
      true
    );
  }

  const { timeoutMs = 15000, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(getApiUrl(path), {
      ...rest,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!isJson) {
      const text = await response.text().catch(() => '');
      if (text.trim().startsWith('<')) {
        throw new ApiError(
          'Backend API endpoint returned HTML instead of JSON. Verify your backend server or VITE_API_BASE_URL configuration.',
          response.ok ? 502 : response.status,
          true
        );
      }
      throw new ApiError(
        `Unexpected response from server (${response.status}).`,
        response.ok ? 502 : response.status
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new ApiError('The backend returned an invalid response.', response.ok ? 502 : response.status);
    }
    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : `Request failed with status ${response.status}.`;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again in a moment.', 504);
    }
    throw new ApiError(
      'Unable to reach the backend service. Please verify your network connection.',
      503
    );
  } finally {
    window.clearTimeout(timer);
  }
}
