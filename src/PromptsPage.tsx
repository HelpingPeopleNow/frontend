import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from './api';
import type { PromptHelper, CreatePromptInput } from './api';

const emptyForm: CreatePromptInput = { title: '', content: '', category: '' };

export default function PromptsPage({ onNavigate }: { onNavigate: () => void }) {
  const [prompts, setPrompts] = useState<PromptHelper[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePromptInput>(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await listPrompts();
      setPrompts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => { load(); }, []);

  const handleFormChange = (field: keyof CreatePromptInput) => (e: h.JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.currentTarget.value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleCreate = async (e: h.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError('');
      if (editing) {
        await updatePrompt(editing, form);
      } else {
        await createPrompt(form);
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEdit = (p: PromptHelper) => {
    setForm({ title: p.title || '', content: p.content || '', category: p.category || '' });
    setEditing(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this prompt helper?')) return;
    try {
      setError('');
      await deletePrompt(id);
      if (editing === id) resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem',
      fontFamily: 'system-ui, sans-serif', background: '#1a1a2e',
      minHeight: '100vh', color: '#e0e0e0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#00d4ff', fontSize: '1.8rem' }}>✏️ Prompt Helpers</h1>
        <button onClick={onNavigate} style={{
          padding: '0.5rem 1rem', border: 'none', borderRadius: '6px',
          background: '#16213e', color: '#00d4ff', cursor: 'pointer', fontWeight: 600,
        }}>
          ← Home
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: '#3d1111', border: '1px solid #e74c3c', borderRadius: '6px', marginBottom: '1rem', color: '#e74c3c' }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCreate} style={{
        background: '#16213e', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem',
      }}>
        <h3 style={{ margin: '0 0 1rem', color: '#a8d8ea' }}>{editing ? '✏️ Update' : '➕ Create'} Prompt Helper</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            placeholder="Title *"
            value={form.title}
            onInput={handleFormChange('title')}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Content *"
            value={form.content}
            onInput={handleFormChange('content')}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <input
            placeholder="Category (optional)"
            value={form.category ?? ''}
            onInput={handleFormChange('category')}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={btnStyle('#00d4ff')}>
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} style={btnStyle('#555')}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* List */}
      <div>
        <h3 style={{ margin: '0 0 1rem', color: '#a8d8ea' }}>
          📋 Saved Prompt Helpers ({prompts.length})
        </h3>
        {prompts.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No prompt helpers yet. Create one above.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {prompts.map((p) => (
            <div key={p.id} style={{
              background: '#16213e', padding: '1rem 1.25rem', borderRadius: '8px',
              border: editing === p.id ? '1px solid #00d4ff' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#00d4ff', fontSize: '1.1rem' }}>{p.title}</strong>
                  {p.category && <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.85rem' }}>— {p.category}</span>}
                  <p style={{ margin: '0.5rem 0 0', color: '#ccc', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                    {p.content.length > 200 ? p.content.slice(0, 200) + '…' : p.content}
                  </p>
                  <small style={{ color: '#555' }}>
                    Created: {new Date(p.created_at).toLocaleString()}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(p)} style={smBtn('#00d4ff')}>✏️</button>
                  <button onClick={() => handleDelete(p.id)} style={smBtn('#e74c3c')}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: h.JSX.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: '6px',
  border: '1px solid #2a2a4a',
  background: '#1a1a2e',
  color: '#e0e0e0',
  fontSize: '0.95rem',
  outline: 'none',
  width: '100%',
};

function btnStyle(bg: string): h.JSX.CSSProperties {
  return {
    padding: '0.6rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    background: bg,
    color: bg === '#555' ? '#ccc' : '#1a1a2e',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  };
}

function smBtn(color: string): h.JSX.CSSProperties {
  return {
    padding: '0.3rem 0.5rem',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    color,
    cursor: 'pointer',
    fontSize: '1.1rem',
  };
}
