import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useLanguage } from '../i18n';
import { useAuth } from '../AuthProvider';
import { fetchPublicProfile, WorkerPublicProfile } from '../lib/publicProfileApi';
import { log, logError } from '../lib/logger';
import { getContact } from '../lib/directMessageApi';

interface Props {
  slug: string;
}

type ProfileState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; profile: WorkerPublicProfile };

export default function PublicProfilePage({ slug }: Props) {
  const { t, lang } = useLanguage();
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchPublicProfile(slug)
      .then(data => {
        if (!cancelled) {
          setState(data === null ? { status: 'not_found' } : { status: 'loaded', profile: data });
        }
      })
      .catch(err => {
        logError('profile', `fetchPublicProfile failed: ${String(err)}`);
        if (!cancelled) setState({ status: 'error', message: String(err) });
      });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (state.status === 'loaded') {
      document.title = `${state.profile.business_name} | HelpingPeopleNow`;
    } else if (state.status === 'not_found') {
      document.title = 'Profile Not Found | HelpingPeopleNow';
    }
    return () => { document.title = 'HelpingPeopleNow'; };
  }, [state]);

  const handleContact = async () => {
    if (!session) {
      route(`/login?redirect=/profile/${encodeURIComponent(slug)}`, false);
      return;
    }
    if (state.status !== 'loaded') return;
    setContactLoading(true);
    try {
      const data = await getContact(state.profile.id);
      if (data.conversation_id) route(`/inbox/${data.conversation_id}`, true);
    } catch (err) {
      logError('profile', `contact failed: ${String(err)}`);
      setContactLoading(false);
    }
  };

  if (state.status === 'loading' || authLoading) {
    return (
      <div class="loading" style={{ minHeight: '100vh' }}>
        <div class="spinner" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div class="profile-page">
        <div class="profile-empty">
          <div class="profile-empty-icon">⚠️</div>
          <h2>{lang === 'es' ? 'Error al cargar el perfil' : 'Error loading profile'}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--sp-2)' }}>{state.message}</p>
          <button class="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }} onClick={() => route('/', false)}>
            {t('nav.back')}
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'not_found') {
    return (
      <div class="profile-page">
        <div class="profile-empty">
          <div class="profile-empty-icon">🔍</div>
          <h2>{t('profile.not_found')}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--sp-2)' }}>
            {lang === 'es'
              ? 'El profesional que buscas no tiene un perfil público todavía.'
              : 'The professional you\'re looking for doesn\'t have a public profile yet.'}
          </p>
          <button class="btn btn-primary" style={{ marginTop: 'var(--sp-4)' }} onClick={() => route('/', false)}>
            {t('nav.back')}
          </button>
        </div>
      </div>
    );
  }

  const profile = state.profile;
  log('profile', `rendering public profile for slug=${slug}`);

  return (
    <div class="profile-page">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav class="landing-nav" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div class="logo" onClick={() => route('/', false)} style={{ cursor: 'pointer' }}>
          <span class="logo-mark">H</span>
          <span>Helping People</span>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <section class="profile-hero">
        <div class="profile-avatar">
          {profile.business_name.charAt(0).toUpperCase()}
        </div>
        <h1 class="profile-name">{profile.business_name}</h1>
        <p class="profile-profession">{profile.profession}</p>
        {profile.city && (
          <p class="profile-location">📍 {profile.city}</p>
        )}
      </section>

      <div class="profile-container">
        {/* ── Stats Row ─────────────────────────────── */}
        <section class="profile-stats">
          {profile.years_experience > 0 && (
            <div class="profile-stat-item">
              <span class="profile-stat-value">{profile.years_experience}</span>
              <span class="profile-stat-label">{t('profile.years_experience')}</span>
            </div>
          )}
          {profile.hourly_rate > 0 && (
            <div class="profile-stat-item">
              <span class="profile-stat-value">€{profile.hourly_rate.toFixed(0)}</span>
              <span class="profile-stat-label">{t('profile.hourly_rate')}</span>
            </div>
          )}
          {profile.minimum_charge > 0 && (
            <div class="profile-stat-item">
              <span class="profile-stat-value">€{profile.minimum_charge.toFixed(0)}</span>
              <span class="profile-stat-label">{t('profile.minimum_charge')}</span>
            </div>
          )}
          <div class="profile-stat-item">
            <span class="profile-stat-value">{profile.free_estimate ? '✓' : '—'}</span>
            <span class="profile-stat-label">{t('profile.free_estimate')}</span>
          </div>
        </section>

        {/* ── Bio ───────────────────────────────────── */}
        {profile.bio && (
          <section class="profile-section">
            <h2 class="profile-section-title">{lang === 'es' ? 'Sobre mí' : 'About'}</h2>
            <p class="profile-bio">{profile.bio}</p>
          </section>
        )}

        {/* ── Details Grid ──────────────────────────── */}
        <section class="profile-section">
          <h2 class="profile-section-title">{lang === 'es' ? 'Detalles' : 'Details'}</h2>
          <div class="profile-details-grid">
            {profile.certifications && profile.certifications.length > 0 && (
              <div class="profile-detail-card">
                <span class="profile-detail-icon">📜</span>
                <span class="profile-detail-label">{lang === 'es' ? 'Certificaciones' : 'Certifications'}</span>
                <span class="profile-detail-value">{profile.certifications.join(', ')}</span>
              </div>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <div class="profile-detail-card">
                <span class="profile-detail-icon">🗣️</span>
                <span class="profile-detail-label">{lang === 'es' ? 'Idiomas' : 'Languages'}</span>
                <span class="profile-detail-value">{profile.languages.join(', ')}</span>
              </div>
            )}
            <div class="profile-detail-card">
              <span class="profile-detail-icon">🛡️</span>
              <span class="profile-detail-label">{lang === 'es' ? 'Seguro' : 'Insurance'}</span>
              <span class="profile-detail-value">{profile.has_insurance ? '✓' : '—'}</span>
            </div>
            <div class="profile-detail-card">
              <span class="profile-detail-icon">⚡</span>
              <span class="profile-detail-label">{lang === 'es' ? 'Emergencias' : 'Emergency'}</span>
              <span class="profile-detail-value">{profile.emergency_service ? '✓' : '—'}</span>
            </div>
          </div>
        </section>

        {/* ── Service Area ──────────────────────────── */}
        {profile.service_radius_km > 0 && (
          <section class="profile-section">
            <p class="profile-service-area">
              {lang === 'es'
                ? `Área de servicio: ${profile.city || ''} (${profile.service_radius_km} km)`
                : `Service area: ${profile.city || ''} (${profile.service_radius_km} km radius)`}
            </p>
          </section>
        )}

        {/* ── Links ─────────────────────────────────── */}
        {(profile.website || (profile.social_links && profile.social_links.length > 0)) && (
          <section class="profile-section">
            <h2 class="profile-section-title">{lang === 'es' ? 'Enlaces' : 'Links'}</h2>
            <div class="profile-links">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" class="profile-link">
                  🌐 {profile.website}
                </a>
              )}
              {profile.social_links && profile.social_links.map((link, i) => (
                <a href={link.url} target="_blank" rel="noopener noreferrer" class="profile-link" key={i}>
                  🔗 {link.platform || link.url}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────── */}
        <section class="profile-cta">
          <button
            class="btn btn-primary btn-lg"
            onClick={handleContact}
            disabled={contactLoading}
            style={{ width: '100%' }}
          >
            {contactLoading ? '⏳ ...' : t('profile.contact')}
          </button>
        </section>
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <footer class="landing-footer">
        <p>© 2026 Helping People. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
