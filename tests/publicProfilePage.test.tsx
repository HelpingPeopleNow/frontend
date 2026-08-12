import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/preact';
import PublicProfilePage from '../src/pages/PublicProfilePage';

// Mock preact-router
const mockRoute = vi.fn();
vi.mock('preact-router', () => ({
  route: (...args: unknown[]) => mockRoute(...args),
}));

// Mock i18n
vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'profile.not_found': 'Profile not found',
        'profile.years_experience': 'Years',
        'profile.hourly_rate': '/hr',
        'profile.minimum_charge': 'min',
        'profile.free_estimate': 'Free estimate',
        'profile.contact': 'Contact this professional',
        'nav.back': 'Back',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

// Mock AuthProvider with mutable session
let mockSession: { user: { id: string; email: string }; token: string } | null = {
  user: { id: 'u-1', email: 'a@b.com' },
  token: 'tok',
};
vi.mock('../src/AuthProvider', () => ({
  useAuth: () => ({
    session: mockSession,
    loading: false,
    error: false,
    sendMagicLink: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: unknown }) => children,
}));

// Mock public profile API
const mockFetchPublicProfile = vi.fn();
vi.mock('../src/lib/publicProfileApi', () => ({
  fetchPublicProfile: (...args: unknown[]) => mockFetchPublicProfile(...args),
}));

// Mock direct message API
const mockGetContact = vi.fn();
vi.mock('../src/lib/directMessageApi', () => ({
  getContact: (...args: unknown[]) => mockGetContact(...args),
}));

// Suppress console log/error
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const makeProfile = (overrides = {}) => ({
  id: 'w-1',
  slug: 'plumbco',
  profession: 'Plumber',
  business_name: 'PlumbCo',
  bio: '10 years fixing pipes',
  city: 'Madrid',
  service_radius_km: 10,
  hourly_rate: 50,
  minimum_charge: 80,
  free_estimate: true,
  years_experience: 8,
  certifications: ['Cert A', 'Cert B'],
  has_insurance: true,
  languages: ['es', 'en'],
  emergency_service: false,
  website: 'https://plumbco.com',
  social_links: [{ platform: 'Instagram', url: 'https://instagram.com/plumbco' }],
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContact.mockReset();
    mockFetchPublicProfile.mockReset();
    mockRoute.mockReset();
    mockSession = { user: { id: 'u-1', email: 'a@b.com' }, token: 'tok' };
  });

  afterEach(() => {
    cleanup();
  });

  describe('loading state', () => {
    it('shows spinner while profile is loading', () => {
      mockFetchPublicProfile.mockReturnValue(new Promise(() => {}));

      render(<PublicProfilePage slug="plumbco" />);

      const spinners = document.querySelectorAll('.spinner');
      expect(spinners.length).toBeGreaterThan(0);
    });
  });

  describe('not found state', () => {
    it('shows not found message when API returns null', async () => {
      mockFetchPublicProfile.mockResolvedValue(null);

      render(<PublicProfilePage slug="nonexistent" />);

      await waitFor(() => {
        expect(screen.getByText('Profile not found')).toBeTruthy();
      });
    });
  });

  describe('error state', () => {
    it('shows error message when API throws', async () => {
      mockFetchPublicProfile.mockRejectedValue(new Error('Server error'));

      render(<PublicProfilePage slug="error-slug" />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading profile/i)).toBeTruthy();
        expect(screen.getByText(/Server error/)).toBeTruthy();
      });
    });
  });

  describe('loaded state', () => {
    it('renders business name and profession', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('PlumbCo')).toBeTruthy();
        expect(screen.getByText('Plumber')).toBeTruthy();
      });
    });

    it('shows city in the hero', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        // City appears in the hero as "📍 Madrid"
        const cityEls = screen.getAllByText(/Madrid/);
        expect(cityEls.length).toBeGreaterThan(0);
      });
    });

    it('renders the bio section', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('10 years fixing pipes')).toBeTruthy();
      });
    });

    it('renders certifications', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('Cert A, Cert B')).toBeTruthy();
      });
    });

    it('renders contact button', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('Contact this professional')).toBeTruthy();
      });
    });

    it('navigates to login when contacting while unauthenticated', async () => {
      mockSession = null;
      mockFetchPublicProfile.mockResolvedValue(makeProfile());

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('Contact this professional')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Contact this professional'));

      expect(mockRoute).toHaveBeenCalledWith(
        expect.stringContaining('/login?redirect=/profile/'),
        false,
      );
    });

    it('navigates to inbox on successful contact', async () => {
      mockFetchPublicProfile.mockResolvedValue(makeProfile());
      mockGetContact.mockResolvedValue({ conversation_id: 'conv-99' });

      render(<PublicProfilePage slug="plumbco" />);

      await waitFor(() => {
        expect(screen.getByText('Contact this professional')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Contact this professional'));

      await waitFor(() => {
        expect(mockGetContact).toHaveBeenCalledWith('w-1');
        expect(mockRoute).toHaveBeenCalledWith('/inbox/conv-99', true);
      });
    });
  });
});
