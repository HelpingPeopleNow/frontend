import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import { useAuth } from './AuthProvider';
import ModeChooser from './ModeChooser';
import LandingNavBar from './LandingNavBar';
import { fetchLatestProfiles, WorkerPublicProfile } from './lib/publicProfileApi';
import { logError } from './lib/logger';

export default function LandingPage() {
  const { t } = useLanguage();
  const { session, loading } = useAuth();
  const [latestProfiles, setLatestProfiles] = useState<WorkerPublicProfile[]>([]);

  useEffect(() => {
    document.title = `Helping People — ${t('landing.hero.badge')}`;
  }, []);

  useEffect(() => {
    fetchLatestProfiles(10).then(setLatestProfiles).catch(err => {
      logError('landing', `fetchLatestProfiles failed: ${err?.message || String(err)}`);
    });
  }, []);

  if (loading) {
    return <div class="loading" style={{ minHeight: '100vh' }}><div class="spinner" /></div>;
  }

  // ── Authenticated: show ModeChooser (no sign-in buttons) ──
  if (session) {
    return (
      <div class="landing" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <LandingNavBar />
        <ModeChooser />
      </div>
    );
  }

  // ── Not authenticated: show marketing landing page ──
  return (
    <div class="landing">
      {/* ── Nav ──────────────────────────────────────── */}
      <LandingNavBar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section class="hero">
        <div class="hero-badge">{t('landing.hero.badge')}</div>
        <h1>
          {t('landing.hero.heading.before')}<br />
          <span class="gradient-text">{t('landing.hero.heading.highlight')}</span>
        </h1>
        <p class="hero-desc">
          {t('landing.hero.desc')}
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" onClick={() => route('/login')}>
            {t('landing.hero.cta.start')}
          </button>
          <button class="btn btn-secondary btn-lg" onClick={() => route('/login')}>
            {t('landing.hero.cta.signin')}
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">500+</div>
            <div class="stat-label">{t('landing.stats.professionals')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">2,400+</div>
            <div class="stat-label">{t('landing.stats.jobs_done')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">4.9</div>
            <div class="stat-label">{t('landing.stats.rating')}</div>
          </div>
        </div>
      </section>

      {/* ── Latest Professionals ────────────────────── */}
      {latestProfiles.length > 0 && (
        <section class="landing-section">
          <div class="section-header">
            <h2>{t('profile.latest_professionals')}</h2>
            <p>{t('landing.profiles.subtitle')}</p>
          </div>
          <div class="profile-card-grid">
            {latestProfiles.map(p => (
              <a href={`/profile/${p.slug || p.id}`} class="profile-card" key={p.id}>
                <span class="profile-card-name">{p.business_name}</span>
                <span class="profile-card-profession">{p.profession}</span>
                {p.city && <span class="profile-card-city">📍 {p.city}</span>}
              </a>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
            <button class="btn btn-ghost btn-lg" onClick={() => route('/find')}>
              {t('profile.view_all')} →
            </button>
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>{t('landing.features.title')}</h2>
          <p>{t('landing.features.subtitle')}</p>
        </div>
        <div class="features-grid">
          <div class="feature-card animate-in">
            <div class="feature-icon blue">🔒</div>
            <h3>{t('landing.features.verified.title')}</h3>
            <p>{t('landing.features.verified.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-1">
            <div class="feature-icon teal">💬</div>
            <h3>{t('landing.features.ai.title')}</h3>
            <p>{t('landing.features.ai.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-2">
            <div class="feature-icon green">⚡</div>
            <h3>{t('landing.features.instant.title')}</h3>
            <p>{t('landing.features.instant.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-3">
            <div class="feature-icon orange">📊</div>
            <h3>{t('landing.features.pricing.title')}</h3>
            <p>{t('landing.features.pricing.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon blue">🌍</div>
            <h3>{t('landing.features.multilingual.title')}</h3>
            <p>{t('landing.features.multilingual.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon green">📱</div>
            <h3>{t('landing.features.mobile.title')}</h3>
            <p>{t('landing.features.mobile.desc')}</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>{t('landing.how.title')}</h2>
          <p>{t('landing.how.subtitle')}</p>
        </div>
        <div class="steps">
          <div class="step animate-in">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>{t('landing.how.step1.title')}</h3>
              <p>{t('landing.how.step1.desc')}</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-1">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>{t('landing.how.step2.title')}</h3>
              <p>{t('landing.how.step2.desc')}</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-2">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>{t('landing.how.step3.title')}</h3>
              <p>{t('landing.how.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>{t('landing.testimonials.title')}</h2>
          <p>{t('landing.testimonials.subtitle')}</p>
        </div>
        <div class="testimonials-grid">
          <div class="testimonial-card animate-in">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              {t('landing.testimonials.1.text')}
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">MG</div>
              <div>
                <div class="testimonial-name">{t('landing.testimonials.1.name')}</div>
                <div class="testimonial-role">{t('landing.testimonials.1.role')}</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-1">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              {t('landing.testimonials.2.text')}
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">JR</div>
              <div>
                <div class="testimonial-name">{t('landing.testimonials.2.name')}</div>
                <div class="testimonial-role">{t('landing.testimonials.2.role')}</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-2">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              {t('landing.testimonials.3.text')}
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">AL</div>
              <div>
                <div class="testimonial-name">{t('landing.testimonials.3.name')}</div>
                <div class="testimonial-role">{t('landing.testimonials.3.role')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section class="landing-cta">
        <h2>{t('landing.cta.title')}</h2>
        <p>{t('landing.cta.desc')}</p>
        <div class="hero-actions" style={{ justifyContent: 'center' }}>
          <button class="btn btn-primary btn-lg" onClick={() => route('/login')}>
            {t('landing.cta.start')}
          </button>
          <button class="btn btn-ghost btn-lg" onClick={() => route('/login')}>
            {t('landing.hero.cta.signin')}
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer class="landing-footer">
        <div class="landing-footer-links">
          <a href="/terms">{t('legal.terms')}</a>
          <a href="/privacy">{t('legal.privacy')}</a>
          <a href="/cookies">{t('legal.cookies')}</a>
        </div>
        <p>{t('landing.footer.copyright')}</p>
      </footer>
    </div>
  );
}
