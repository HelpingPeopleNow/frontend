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
    document.title = `Helping People — Trusted Home Services`;
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
        <div class="hero-badge">De confianza para propietarios y profesionales</div>
        <h1>
          Tu hogar merece<br />
          <span class="gradient-text">a los mejores profesionales</span>
        </h1>
        <p class="hero-desc">
          Conectamos con profesionales locales verificados y asegurados para todo tipo de servicios del hogar — fontanería, electricidad, limpieza y más.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" onClick={() => route('/login')}>
            Empieza Gratis
          </button>
          <button class="btn btn-secondary btn-lg" onClick={() => route('/login')}>
            Iniciar Sesión
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">500+</div>
            <div class="stat-label">Profesionales Verificados</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">2,400+</div>
            <div class="stat-label">Trabajos Realizados</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">4.9</div>
            <div class="stat-label">Valoración Media</div>
          </div>
        </div>
      </section>

      {/* ── Latest Professionals ────────────────────── */}
      {latestProfiles.length > 0 && (
        <section class="landing-section">
          <div class="section-header">
            <h2>{t('profile.latest_professionals')}</h2>
            <p>Profesionales verificados listos para ayudarte.</p>
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
          <h2>Por qué los profesionales nos eligen</h2>
          <p>Una plataforma creada para la confianza, la calidad y conexiones sin complicaciones.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card animate-in">
            <div class="feature-icon blue">🔒</div>
            <h3>Profesionales Verificados</h3>
            <p>Cada trabajador pasa por comprobaciones de seguro, verificación de antecedentes y validación de credenciales.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-1">
            <div class="feature-icon teal">💬</div>
            <h3>Emparejamiento con IA</h3>
            <p>Nuestro asistente inteligente entiende tus necesidades y te conecta con el profesional perfecto.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-2">
            <div class="feature-icon green">⚡</div>
            <h3>Respuesta Instantánea</h3>
            <p>Conecta con profesionales disponibles en minutos, no en días. Servicios de emergencia disponibles.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-3">
            <div class="feature-icon orange">📊</div>
            <h3>Precios Transparentes</h3>
            <p>Consulta tarifas por hora, cargos mínimos y presupuestos gratuitos de antemano. Sin costes ocultos.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon blue">🌍</div>
            <h3>Soporte Multilingüe</h3>
            <p>Comunícate en tu idioma preferido. Nuestra plataforma soporta inglés y español.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon green">📱</div>
            <h3>Móvil Primero</h3>
            <p>Gestiona tus servicios desde cualquier lugar. Funcionalidad completa en cualquier dispositivo.</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>Cómo funciona</h2>
          <p>Tres sencillos pasos para que te atiendan en tu hogar.</p>
        </div>
        <div class="steps">
          <div class="step animate-in">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Cuéntanos qué necesitas</h3>
              <p>Describe tu solicitud de servicio del hogar en una conversación rápida con nuestro asistente IA. Sin formularios.</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-1">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Emparejamiento instantáneo</h3>
              <p>Nuestro sistema encuentra profesionales verificados en tu zona que se ajustan a tus requisitos.</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-2">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Contrata con confianza</h3>
              <p>Revisa perfiles, compara tarifas y contrata profesionales de confianza. Todo respaldado por nuestra garantía de calidad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>La confianza de los propietarios</h2>
          <p>Mira lo que dice nuestra comunidad.</p>
        </div>
        <div class="testimonials-grid">
          <div class="testimonial-card animate-in">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "Encontré un fontanero en 10 minutos. La IA entendió exactamente lo que necesitaba y me conectó con un profesional verificado. Increíble servicio."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">MG</div>
              <div>
                <div class="testimonial-name">María García</div>
                <div class="testimonial-role">Propietaria, Madrid</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-1">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "Como electricista, esta plataforma ha transformado mi negocio. Consigo clientes cualificados y el creador de perfil fue muy fácil — solo una conversación."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">JR</div>
              <div>
                <div class="testimonial-name">Juan Rodríguez</div>
                <div class="testimonial-role">Electricista Certificado</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-2">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "La transparencia fue lo que me convenció. Pude ver tarifas, certificaciones y estado del seguro antes de contratar. Sin sorpresas."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">AL</div>
              <div>
                <div class="testimonial-name">Ana López</div>
                <div class="testimonial-role">Gestora de Propiedades</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section class="landing-cta">
        <h2>¿Listo para encontrar a tu próximo profesional?</h2>
        <p>Únete a miles de propietarios y profesionales que ya usan Helping People.</p>
        <div class="hero-actions" style={{ justifyContent: 'center' }}>
          <button class="btn btn-primary btn-lg" onClick={() => route('/login')}>
            Empieza Gratis Hoy
          </button>
          <button class="btn btn-ghost btn-lg" onClick={() => route('/login')}>
            Iniciar Sesión
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer class="landing-footer">
        <div class="landing-footer-links">
          <a href="/terms">Términos y Condiciones</a>
          <a href="/privacy">Política de Privacidad</a>
          <a href="/cookies">Política de Cookies</a>
        </div>
        <p>© 2026 Helping People. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
