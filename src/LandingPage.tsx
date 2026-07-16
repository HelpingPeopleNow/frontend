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
  const { t, lang } = useLanguage();
  const { session, loading } = useAuth();
  const [latestProfiles, setLatestProfiles] = useState<WorkerPublicProfile[]>([]);
  const [profilesError, setProfilesError] = useState(false);

  useEffect(() => {
    document.title = `Helping People — ${t('landing.hero.badge')}`;
  }, []);

  useEffect(() => {
    fetchLatestProfiles(10).then(setLatestProfiles).catch(err => {
      logError('landing', `fetchLatestProfiles failed: ${err?.message || String(err)}`);
      setProfilesError(true);
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
        </div>

        {/* ── Benefit chips (replace stats) ───────────── */}
        <div class="benefit-chips">
          <span class="benefit-chip">✓ {t('landing.benefits.chip1')}</span>
          <span class="benefit-chip">✓ {t('landing.benefits.chip2')}</span>
          <span class="benefit-chip">✓ {t('landing.benefits.chip3')}</span>
          <span class="benefit-chip">✓ {t('landing.benefits.chip4')}</span>
          <span class="benefit-chip">✓ {t('landing.benefits.chip5')}</span>
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
            {latestProfiles.filter(p => p.bio && p.bio.trim()).map(p => (
              <a href={`/profile/${p.slug || p.id}`} class="profile-card" key={p.id}>
                <span class="profile-card-name">{p.business_name}</span>
                <span class="profile-card-profession">{p.profession}</span>
                <span class="profile-card-bio">{p.bio.length > 120 ? p.bio.slice(0, 117) + '…' : p.bio}</span>
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

      {/* ── Profiles load error (non-blocking) ──────── */}
      {profilesError && latestProfiles.length === 0 && (
        <section class="landing-section" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            ⚠️ {lang === 'es' ? 'No se pudieron cargar los perfiles. Inténtalo más tarde.' : 'Could not load profiles. Please try again later.'}
          </p>
        </section>
      )}

      {/* ── Features (6 plain-language cards) ────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>{t('landing.features.title')}</h2>
          <p>{t('landing.features.subtitle')}</p>
        </div>
        <div class="features-grid">
          <div class="feature-card animate-in">
            <div class="feature-icon teal">🎤</div>
            <h3>{t('landing.features.voice.title')}</h3>
            <p>{t('landing.features.voice.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-1">
            <div class="feature-icon blue">💡</div>
            <h3>{t('landing.features.understand.title')}</h3>
            <p>{t('landing.features.understand.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-2">
            <div class="feature-icon green">📍</div>
            <h3>{t('landing.features.results.title')}</h3>
            <p>{t('landing.features.results.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-3">
            <div class="feature-icon blue">🌐</div>
            <h3>{t('landing.features.languages.title')}</h3>
            <p>{t('landing.features.languages.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon teal">💬</div>
            <h3>{t('landing.features.chat.title')}</h3>
            <p>{t('landing.features.chat.desc')}</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon green">🔒</div>
            <h3>{t('landing.features.passwordless.title')}</h3>
            <p>{t('landing.features.passwordless.desc')}</p>
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

      {/* ── Scenarios (replace testimonials) ──────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>{t('landing.scenarios.title')}</h2>
          <p>{t('landing.scenarios.subtitle')}</p>
        </div>
        <div class="scenarios-grid">
          <div class="scenario-card animate-in">
            <h3>{t('landing.scenarios.1.title')}</h3>
            <p>{t('landing.scenarios.1.desc')}</p>
          </div>
          <div class="scenario-card animate-in animate-in-delay-1">
            <h3>{t('landing.scenarios.2.title')}</h3>
            <p>{t('landing.scenarios.2.desc')}</p>
          </div>
          <div class="scenario-card animate-in animate-in-delay-2">
            <h3>{t('landing.scenarios.3.title')}</h3>
            <p>{t('landing.scenarios.3.desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Why we built it ───────────────────────────── */}
      <section class="landing-section why-section">
        <h2>{t('landing.why.title')}</h2>
        <p class="why-body">{t('landing.why.body')}</p>
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
