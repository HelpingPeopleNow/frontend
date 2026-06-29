import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSystemPrompts,
  updateSystemPromptColumn,
  updateLlmProvider,
} from '../../src/services/systemPrompts';
import { jsonResponse } from '../helpers/fetch';

describe('services/systemPrompts', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getSystemPrompts GETs /api/v1/system-prompts', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ body: {} }));
    await getSystemPrompts();
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/system-prompts', expect.any(Object));
  });

  it('updateSystemPromptColumn PUTs to /api/v1/system-prompts/{column} with { content } body', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ body: {} }));
    await updateSystemPromptColumn('worker_profile_prompt', 'You are a helpful assistant.');
    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/v1/system-prompts/worker_profile_prompt');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      content: 'You are a helpful assistant.',
    });
  });

  it('updateLlmProvider PUTs to /api/v1/system-prompts/provider', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ body: {} }));
    await updateLlmProvider('mistral');
    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/v1/system-prompts/provider');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ content: 'mistral' });
  });
});