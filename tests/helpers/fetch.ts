import { vi } from 'vitest';

export interface MockResponseOpts {
  status?: number;
  ok?: boolean;
  body?: unknown;
  parseError?: boolean;
}

export function jsonResponse(opts: MockResponseOpts = {}): Response {
  const status = opts.status ?? 200;
  const ok = opts.ok ?? (status >= 200 && status < 300);
  const body = opts.body;

  return {
    status,
    ok,
    json: vi.fn().mockImplementation(() => {
      if (opts.parseError) return Promise.reject(new Error('invalid json'));
      return Promise.resolve(body);
    }),
    text: vi.fn().mockResolvedValue(JSON.stringify(body ?? {})),
  } as unknown as Response;
}