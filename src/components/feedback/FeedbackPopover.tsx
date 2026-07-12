import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { submitFeedback, FeedbackCategory } from '../../lib/feedbackApi';
import { log, logError } from '../../lib/logger';

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: 'bug', label: 'Bug', emoji: '🐛' },
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'complaint', label: 'Complaint', emoji: '😤' },
  { value: 'general', label: 'General', emoji: '💬' },
];

interface Props {
  onSubmit?: () => void;
  submitted?: boolean;
  onSubmittedReset?: () => void;
}

export default function FeedbackPopover({ onSubmit, submitted: controlledSubmitted, onSubmittedReset }: Props) {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isSubmitted = controlledSubmitted ?? submitted;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await submitFeedback({
        message: message.trim(),
        page_url: window.location.href,
        category,
      });
      setSubmitted(true);
      onSubmittedReset?.();
      onSubmit?.();
      setTimeout(() => {
        onSubmit?.();
      }, 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit';
      logError('feedback', msg, err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setCategory('general');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <div class="feedback-popover">
        <div class="feedback-success">
          <span class="feedback-success-icon">✅</span>
          <span>Thanks for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div class="feedback-popover">
      <form onSubmit={handleSubmit}>
        <div class="feedback-header">
          <strong>Send Feedback</strong>
          <span class="feedback-subtitle">Help us improve the platform</span>
        </div>

        <div class="feedback-categories">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              class={`feedback-cat-btn ${category === c.value ? 'active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <textarea
          class="feedback-textarea"
          placeholder="What's on your mind? (bug, idea, complaint...)"
          rows={4}
          maxLength={2000}
          value={message}
          onInput={(e: any) => setMessage(e.target.value)}
        />

        <div class="feedback-footer">
          <span class="feedback-char-count">{message.length}/2000</span>
          {error && <span class="feedback-error">{error}</span>}
          <button
            type="submit"
            class="feedback-submit-btn"
            disabled={!message.trim() || submitting}
          >
            {submitting ? '...' : 'Send'}
          </button>
        </div>
      </form>

      <style>{`
        .feedback-popover {
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          width: 340px;
          padding: 16px;
          animation: feedbackSlideUp 0.2s ease-out;
        }
        @keyframes feedbackSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feedback-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          font-size: 15px;
        }
        .feedback-success-icon { font-size: 20px; }
        .feedback-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 12px;
        }
        .feedback-header strong {
          font-size: 15px;
          color: var(--text);
        }
        .feedback-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .feedback-categories {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .feedback-cat-btn {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .feedback-cat-btn:hover {
          border-color: var(--accent);
          color: var(--text);
        }
        .feedback-cat-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .feedback-textarea {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          color: var(--text);
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .feedback-textarea:focus {
          outline: none;
          border-color: var(--accent);
        }
        .feedback-textarea::placeholder {
          color: var(--text-secondary);
        }
        .feedback-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }
        .feedback-char-count {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .feedback-error {
          font-size: 12px;
          color: var(--error);
          flex: 1;
        }
        .feedback-submit-btn {
          margin-left: auto;
          background: var(--gradient-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .feedback-submit-btn:hover { opacity: 0.9; }
        .feedback-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
