export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface WorkerCard {
  id: number;
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
}

export interface ChatRequest {
  mode: 'worker_intake' | 'client_intake' | 'search';
  message: string;
  lang: string;
  history?: ChatHistoryItem[];
  conversation_id?: string;
}

export interface ChatResponse {
  answer: string;
  response?: string;
  text?: string;
  workers?: WorkerCard[];
  conversation_id?: string;
}

export function sendChat(req: ChatRequest): Promise<Response> {
  return fetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(req),
  });
}

