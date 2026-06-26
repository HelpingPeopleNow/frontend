import { log, logError } from '../lib/logger';
import { request } from './api';

export interface ConversationDTO {
  id: string;
  user_id: string;
  type: string;
  metadata?: Record<string, unknown>;
  messages?: ConversationMessageDTO[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMessageDTO {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationListResponse {
  conversations: ConversationDTO[];
  total: number;
  limit: number;
  offset: number;
}

export function listConversations(type?: string, limit = 20, offset = 0): Promise<ConversationListResponse> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  log('chat', `listing conversations type=${type || 'all'} limit=${limit} offset=${offset}`);
  return request<ConversationListResponse>(`/api/v1/conversations?${params.toString()}`);
}

export function getConversation(id: string): Promise<ConversationDTO> {
  log('chat', `getting conversation ${id}`);
  return request<ConversationDTO>(`/api/v1/conversations/${id}`);
}
