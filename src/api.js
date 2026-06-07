const BASE = '/api/v1/prompt-helpers';

export async function listPrompts() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch prompt helpers');
  return res.json();
}

export async function getPrompt(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function createPrompt({ title, content, category }) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, category }),
  });
  if (!res.ok) throw new Error('Failed to create');
  return res.json();
}

export async function updatePrompt(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
}

export async function deletePrompt(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}
