import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import FeedbackPopover from './FeedbackPopover';
import { log } from '../../lib/logger';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        log('feedback', 'close via outside click');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Hide on admin pages.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div class="feedback-widget" ref={ref}>
      {open && (
        <div class="feedback-popover-container">
          <FeedbackPopover onSubmit={() => { setOpen(false); log('feedback', 'close via submit'); }} onSubmittedReset={() => setOpen(false)} />
        </div>
      )}

      <button
        class={`feedback-fab ${open ? 'active' : ''}`}
        onClick={() => { const next = !open; setOpen(next); log('feedback', next ? 'open' : 'close'); }}
        aria-label="Send feedback"
      >
        💬
      </button>

      <style>{`
        .feedback-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9998;
        }
        .feedback-popover-container {
          position: absolute;
          bottom: 52px;
          right: 0;
        }
        .feedback-fab {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--gradient-primary);
          border: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.15s ease;
          color: #fff;
        }
        .feedback-fab:hover {
          transform: scale(1.08);
        }
        .feedback-fab.active {
          background: var(--surface-2);
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
