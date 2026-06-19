const BASE = '/api/v1';

async function fetchJSON(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
  if (res.status === 204) return undefined;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DMConversationItem {
  id: string;
  other_party: { id: string; name: string; role: string };
  last_message?: { preview: string; at: string };
  unread_count: number;
  status: string;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface DMContactResult {
  conversation_id: string;
  worker: { id: string; user_id: string; profession: string; business_name: string; city: string };
  created: boolean;
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function getContact(workerProfileId: string): Promise<DMContactResult> {
  return fetchJSON(`/workers/${workerProfileId}/contact`);
}

export async function listConversations(params: {
  status?: string;
  limit?: number;
} = {}): Promise<{ conversations: DMConversationItem[] }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return fetchJSON(`/direct-messages${q ? '?' + q : ''}`);
}

export async function getMessages(
  convId: string,
  params: { limit?: number; before?: string } = {},
): Promise<{ messages: DMMessage[]; has_more: boolean }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.before) qs.set('before', params.before);
  const q = qs.toString();
  return fetchJSON(`/direct-messages/${convId}/messages${q ? '?' + q : ''}`);
}

export async function sendMessage(
  convId: string,
  body: string,
): Promise<DMMessage> {
  return fetchJSON(`/direct-messages/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function markRead(convId: string): Promise<void> {
  return fetchJSON(`/direct-messages/${convId}/read`, { method: 'PATCH' });
}

export async function archiveConversation(convId: string): Promise<void> {
  return fetchJSON(`/direct-messages/${convId}/archive`, { method: 'POST' });
}

export async function blockConversation(convId: string): Promise<void> {
  return fetchJSON(`/direct-messages/${convId}/block`, { method: 'POST' });
}

export async function reportConversation(convId: string, reason?: string): Promise<void> {
  return fetchJSON(`/direct-messages/${convId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  });
}

export async function pollSince(ts: string): Promise<{ messages: DMMessage[]; server_time: string }> {
  return fetchJSON(`/direct-messages/since?ts=${encodeURIComponent(ts)}`);
}
