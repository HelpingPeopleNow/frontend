import { log, logError } from '../lib/logger';

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface WorkerCard {
  id: string;
  profession: string;
  business_name: string;
  bio: string;
  city: string;
  hourly_rate: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  emergency_service: boolean;
  slug: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

export interface ChatRequest {
  mode: 'worker_intake' | 'client_intake' | 'search';
  message: string;
  lang: string;
  history?: ChatHistoryItem[];
  conversation_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatResponse {
  answer: string;
  response?: string;
  text?: string;
  workers?: WorkerCard[];
  conversation_id?: string;
}

export function sendChat(req: ChatRequest, signal?: AbortSignal): Promise<Response> {
  log('chat', `sending message mode=${req.mode} msg_len=${req.message.length} conv=${req.conversation_id || 'new'} lang=${req.lang}`);
  try {
    return fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    logError('chat', 'sendChat network error', e);
    throw e;
  }
}
