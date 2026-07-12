import { log } from '../lib/logger';
import { request } from './api';

export interface SystemPromptDTO {
  worker_profile_prompt: string;
  client_profile_prompt: string;
  find_trader_search_prompt: string;
  find_trader_presentation_prompt: string;
  llm_provider: string;
  [key: string]: string;
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

export function updateLlmProvider(provider: string): Promise<SystemPromptDTO> {
  log('admin', `updating LLM provider to ${provider}`);
  return request<SystemPromptDTO>('/api/v1/system-prompts/provider', {
    method: 'PUT',
    body: JSON.stringify({ content: provider }),
  });
}
