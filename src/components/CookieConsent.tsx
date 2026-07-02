import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useLanguage } from '../i18n';

const STORAGE_KEY = 'hp_cookie_consent_seen';

export default function CookieConsent() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't seen it before
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay to avoid blocking initial render
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div class="cookie-consent">
      <div class="cookie-consent-content">
        <span class="cookie-consent-icon">🍪</span>
        <p>
          {isEn
            ? 'We use only strictly necessary cookies for login. No tracking, no ads. '
            : 'Usamos solo cookies estrictamente necesarias para el login. Sin rastreo, sin anuncios. '}
          <a href="/cookies" class="cookie-consent-link">
            {isEn ? 'Learn more' : 'Saber más'}
          </a>
        </p>
        <button class="cookie-consent-dismiss" onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>

      <style>{`
        .cookie-consent {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          background: var(--surface);
          border-top: 1px solid var(--border-strong);
          padding: 12px 16px;
          animation: slideUp 0.3s ease-out;
        }

        .cookie-consent-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cookie-consent-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .cookie-consent p {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          flex: 1;
        }

        .cookie-consent-link {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .cookie-consent-link:hover {
          color: var(--primary-hover);
        }

        .cookie-consent-dismiss {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 4px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .cookie-consent-dismiss:hover {
          background: var(--surface-hover);
          color: var(--text);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 640px) {
          .cookie-consent {
            padding: 10px 12px;
          }

          .cookie-consent-content {
            gap: 8px;
          }

          .cookie-consent p {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
