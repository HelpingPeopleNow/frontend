import { h } from 'preact';
import { route } from 'preact-router';
import { useLanguage } from './i18n';
import { useAuth } from './AuthProvider';
import { useEffect } from 'preact/hooks';

export default function LandingPage() {
  const { t } = useLanguage();
  const { session, loading } = useAuth();

  // Redirect authenticated users to chat
  useEffect(() => {
    if (!loading && session) {
      route('/chat', true);
    }
  }, [loading, session]);

  if (loading) {
    return <div class="loading" style={{ minHeight: '100vh' }}><div class="spinner" /></div>;
  }

  if (session) return null;

  return (
    <div class="landing">
      {/* ── Nav ──────────────────────────────────────── */}
      <nav class="landing-nav">
        <div class="logo">
          <span class="logo-mark">H</span>
          <span>HelpingPeopleNow</span>
        </div>
        <div class="landing-nav-links">
          <button class="btn btn-ghost btn-sm" onClick={() => route('/login')}>
            {t('auth.signin')}
          </button>
          <button class="btn btn-primary btn-sm" onClick={() => route('/signup')}>
            {t('auth.signup')}
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section class="hero">
        <div class="hero-badge">Trusted by homeowners & professionals</div>
        <h1>
          Your home deserves<br />
          <span class="gradient-text">the best professionals</span>
        </h1>
        <p class="hero-desc">
          Connecting you with verified, insured local professionals for every home service — plumbing, electrical, cleaning, and more.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" onClick={() => route('/signup')}>
            Get Started Free
          </button>
          <button class="btn btn-secondary btn-lg" onClick={() => route('/login')}>
            I'm a Professional
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-value">500+</div>
            <div class="stat-label">Verified Professionals</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">2,400+</div>
            <div class="stat-label">Jobs Completed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">4.9</div>
            <div class="stat-label">Average Rating</div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>Why professionals choose us</h2>
          <p>A platform built for trust, quality, and seamless connections.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card animate-in">
            <div class="feature-icon blue">🔒</div>
            <h3>Verified Professionals</h3>
            <p>Every worker is vetted with insurance checks, background verification, and credential validation.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-1">
            <div class="feature-icon teal">💬</div>
            <h3>AI-Powered Matching</h3>
            <p>Our intelligent assistant understands your needs and connects you with the perfect professional.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-2">
            <div class="feature-icon green">⚡</div>
            <h3>Instant Response</h3>
            <p>Get matched with available professionals in minutes, not days. Emergency services available.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-3">
            <div class="feature-icon orange">📊</div>
            <h3>Transparent Pricing</h3>
            <p>See hourly rates, minimum charges, and free estimates upfront. No hidden fees.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon blue">🌍</div>
            <h3>Multilingual Support</h3>
            <p>Communicate in your preferred language. Our platform supports English and Spanish.</p>
          </div>
          <div class="feature-card animate-in animate-in-delay-4">
            <div class="feature-icon green">📱</div>
            <h3>Mobile First</h3>
            <p>Manage your services from anywhere. Full functionality on any device, anywhere.</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>How it works</h2>
          <p>Three simple steps to get your home services done.</p>
        </div>
        <div class="steps">
          <div class="step animate-in">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Tell us what you need</h3>
              <p>Describe your home service request in a quick conversation with our AI assistant. No forms to fill.</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-1">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Get matched instantly</h3>
              <p>Our system finds verified professionals in your area that match your specific requirements.</p>
            </div>
          </div>
          <div class="step animate-in animate-in-delay-2">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Book with confidence</h3>
              <p>Review profiles, compare rates, and hire professionals you can trust. All backed by our quality guarantee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section class="landing-section">
        <div class="section-header">
          <h2>Trusted by homeowners</h2>
          <p>See what our community has to say.</p>
        </div>
        <div class="testimonials-grid">
          <div class="testimonial-card animate-in">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "Found a plumber within 10 minutes. The AI understood exactly what I needed and matched me with a verified professional. Incredible service."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">MG</div>
              <div>
                <div class="testimonial-name">Maria Garcia</div>
                <div class="testimonial-role">Homeowner, Madrid</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-1">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "As an electrician, this platform has transformed my business. I get qualified leads and the profile builder was so easy — just a chat conversation."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">JR</div>
              <div>
                <div class="testimonial-name">Juan Rodriguez</div>
                <div class="testimonial-role">Licensed Electrician</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card animate-in animate-in-delay-2">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">
              "The transparency is what sold me. I could see rates, certifications, and insurance status before booking. No surprises."
            </p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">AL</div>
              <div>
                <div class="testimonial-name">Ana Lopez</div>
                <div class="testimonial-role">Property Manager</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section class="landing-cta">
        <h2>Ready to find your next professional?</h2>
        <p>Join thousands of homeowners and professionals already using HelpingPeopleNow.</p>
        <div class="hero-actions" style={{ justifyContent: 'center' }}>
          <button class="btn btn-primary btn-lg" onClick={() => route('/signup')}>
            Start Free Today
          </button>
          <button class="btn btn-ghost btn-lg" onClick={() => route('/login')}>
            Sign In
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer class="landing-footer">
        <p>© 2026 HelpingPeopleNow. All rights reserved.</p>
      </footer>
    </div>
  );
}
