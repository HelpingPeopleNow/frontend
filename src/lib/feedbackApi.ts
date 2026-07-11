import { log, logError } from './logger';
import { request } from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type FeedbackCategory = 'bug' | 'idea' | 'complaint' | 'general';

export interface Feedback {
  id: string;
  user_id: string;
  page_url: string;
  message: string;
  category: FeedbackCategory;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function submitFeedback(data: {
  message: string;
  page_url: string;
  category: FeedbackCategory;
}): Promise<Feedback> {
  log('feedback', `submit: category=${data.category} page=${data.page_url}`);
  return request<Feedback>('/api/v1/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
