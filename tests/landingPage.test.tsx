import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/preact';
import LandingPage from '../src/LandingPage';
import { route } from 'preact-router';

vi.mock('preact-router', () => ({ route: vi.fn() }));

// Controlled i18n
let lang = 'en';
vi.mock('../src/i18n', () => ({
  useLanguage: () => ({ lang, setLang: vi.fn(), t: (key: string) => key }),
}));

// Controlled auth state
const authState = { session: null as unknown, loading: false };
vi.mock('../src/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.mock('../src/ModeChooser', () => ({
  default: () => <div data-testid="mode-chooser">mode-chooser</div>,
}));

vi.mock('../src/LandingNavBar', () => ({
  default: () => <nav data-testid="landing-nav">nav</nav>,
}));

const fetchLatestProfiles = vi.fn();
vi.mock('../src/lib/publicProfileApi', () => ({
  fetchLatestProfiles: (...args: unknown[]) => fetchLatestProfiles(...args),
}));

vi.spyOn(console, 'error').mockImplementation(() => {});

const profile = (over: Record<string, unknown> = {}) => ({
  id: 'w-1',
  slug: 'plumbco',
  business_name: 'PlumbCo',
  profession: 'Plumber',
  bio: 'Fixing pipes for a decade',
  city: 'Madrid',
  ...over,
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lang = 'en';
    authState.session = null;
    authState.loading = false;
    fetchLatestProfiles.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the loading spinner while the session is being checked', () => {
    authState.loading = true;
    render(<LandingPage />);
    expect(document.querySelector('.spinner')).toBeTruthy();
    expect(screen.queryByTestId('landing-nav')).toBeNull();
  });

  it('renders ModeChooser and no sign-in buttons for authenticated users', async () => {
    authState.session = { user: { id: 'u-1' } };
    render(<LandingPage />);
    expect(screen.getByTestId('landing-nav')).toBeTruthy();
    expect(screen.getByTestId('mode-chooser')).toBeTruthy();
    await waitFor(() => expect(fetchLatestProfiles).toHaveBeenCalledWith(10));
  });

  it('renders the hero with badge, CTA and benefit chips for visitors', async () => {
    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText('landing.hero.badge')).toBeTruthy();
    });
    expect(screen.getByText('landing.hero.desc')).toBeTruthy();

    const chips = document.querySelectorAll('.benefit-chip');
    expect(chips.length).toBe(5);

    // CTA routes to /login
    (screen.getByText('landing.hero.cta.start') as HTMLButtonElement).click();
    expect(route).toHaveBeenCalledWith('/login');
  });

  it('renders features, steps, scenarios and footer sections', async () => {
    render(<LandingPage />);
    await waitFor(() => expect(fetchLatestProfiles).toHaveBeenCalled());

    expect(screen.getByText('landing.features.title')).toBeTruthy();
    expect(document.querySelectorAll('.feature-card').length).toBe(6);
    expect(screen.getByText('landing.how.title')).toBeTruthy();
    expect(document.querySelectorAll('.step').length).toBe(3);
    expect(screen.getByText('landing.scenarios.title')).toBeTruthy();
    expect(document.querySelectorAll('.scenario-card').length).toBe(3);
    expect(screen.getByText('landing.why.title')).toBeTruthy();
    expect(screen.getByText('landing.cta.title')).toBeTruthy();
    expect(document.querySelector('a[href="/terms"]')).toBeTruthy();
    expect(document.querySelector('a[href="/privacy"]')).toBeTruthy();
    expect(document.querySelector('a[href="/cookies"]')).toBeTruthy();
  });

  it('renders latest professional cards with city, slug link and long-bio truncation', async () => {
    fetchLatestProfiles.mockResolvedValue([
      profile(),
      profile({
        id: 'w-2',
        slug: '',
        business_name: 'ElectroFix',
        profession: 'Electrician',
        city: '',
        bio: 'x'.repeat(200),
      }),
      profile({ id: 'w-3', business_name: 'NoBio', bio: '   ' }), // filtered out
    ]);

    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText('PlumbCo')).toBeTruthy();
    });

    const cards = document.querySelectorAll('a.profile-card');
    expect(cards.length).toBe(2); // empty-bio card filtered

    // Full bio shown when <= 120 chars
    expect(screen.getByText('Fixing pipes for a decade')).toBeTruthy();
    // Long bio truncated to 117 chars + ellipsis
    expect(screen.getByText(/…$/)).toBeTruthy();
    // City chip only when present
    expect(screen.getByText('📍 Madrid')).toBeTruthy();
    expect(screen.getByText('profile.latest_professionals')).toBeTruthy();

    // slug used when present, id fallback otherwise
    expect(cards[0].getAttribute('href')).toBe('/profile/plumbco');
    expect(cards[1].getAttribute('href')).toBe('/profile/w-2');

    // View-all button routes to /find
    (screen.getByText('profile.view_all →') as HTMLButtonElement).click();
    expect(route).toHaveBeenCalledWith('/find');
  });

  it('shows a non-blocking error section when profiles fail to load (EN)', async () => {
    fetchLatestProfiles.mockRejectedValue(new Error('network down'));
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load profiles/)).toBeTruthy();
    });
  });

  it('shows the Spanish error message when profiles fail to load (ES)', async () => {
    lang = 'es';
    fetchLatestProfiles.mockRejectedValue(new Error('network down'));
    render(<LandingPage />);
    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar los perfiles/)).toBeTruthy();
    });
  });

  it('bottom CTA buttons route to /login', async () => {
    render(<LandingPage />);
    await waitFor(() => expect(fetchLatestProfiles).toHaveBeenCalled());
    (screen.getByText('landing.cta.start') as HTMLButtonElement).click();
    expect(route).toHaveBeenCalledWith('/login');
    (screen.getByText('landing.hero.cta.signin') as HTMLButtonElement).click();
    expect(route).toHaveBeenCalledWith('/login');
  });
});
