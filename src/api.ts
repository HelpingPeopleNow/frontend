const BASE = '/api/v1/prompt-helpers';

export interface PromptHelper {
  id: number;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreatePromptInput {
  title: string;
  content: string;
  category?: string;
}

export async function listPrompts(): Promise<PromptHelper[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch prompt helpers');
  return res.json();
}

export async function getPrompt(id: number): Promise<PromptHelper> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function createPrompt(data: CreatePromptInput): Promise<PromptHelper> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create');
  return res.json();
}

export async function updatePrompt(id: number, data: Partial<CreatePromptInput>): Promise<PromptHelper> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export async function deletePrompt(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}
