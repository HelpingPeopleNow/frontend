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
  return request('/api/v1/system-prompts');
}

export function updateSystemPromptColumn(column: string, content: string): Promise<SystemPromptDTO> {
  return request(`/api/v1/system-prompts/${column}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function updateLlmProvider(provider: string): Promise<SystemPromptDTO> {
  return request('/api/v1/system-prompts/provider', {
    method: 'PUT',
    body: JSON.stringify({ content: provider }),
  });
}
