import { log } from '../lib/logger';
import { request } from './api';

export interface SystemPromptDTO {
  worker_profile_prompt: string;
  client_profile_prompt: string;
  find_trader_search_prompt: string;
  find_trader_presentation_prompt: string;
  llm_providers: string[];
  updated_at: string;
}

export function getSystemPrompts(): Promise<SystemPromptDTO> {
  log('admin', 'fetching system prompts');
  return request<SystemPromptDTO>('/api/v1/system-prompts');
}

export function updateSystemPromptColumn(column: string, content: string): Promise<SystemPromptDTO> {
  log('admin', `updating prompt column=${column} length=${content.length}`);
  return request<SystemPromptDTO>(`/api/v1/system-prompts/${column}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function updateLlmProviders(providers: string[]): Promise<SystemPromptDTO> {
  log('admin', `updating LLM providers to [${providers.join(', ')}]`);
  return request<SystemPromptDTO>('/api/v1/system-prompts/provider', {
    method: 'PUT',
    body: JSON.stringify({ providers }),
  });
}
