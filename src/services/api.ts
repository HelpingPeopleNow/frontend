import { log, logError } from '../lib/logger';

const API_BASE = '';
const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(public status: number, message: string, public path?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  log('api', `${options.method || 'GET'} ${path}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    signal: options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => {
      logError('api', `failed to parse error body for ${res.status} ${options.method || 'GET'} ${path}`);
      return {};
    });
    const errMsg = body.error || res.statusText || `Request failed with status ${res.status}`;
    logError('api', `${res.status} ${options.method || 'GET'} ${path}: ${errMsg}`);
    throw new ApiError(res.status, errMsg, path);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
