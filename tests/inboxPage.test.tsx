import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/preact';
import InboxPage from '../src/pages/InboxPage';

// Mock AppShell — just renders children
vi.mock('../src/AppShell', () => ({
  default: ({ children }: { children: preact.ComponentChildren }) => children,
}));

// Mock i18n
vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dm.inbox.title': 'Inbox',
        'dm.inbox.empty.title': 'No messages yet',
        'dm.inbox.empty.desc': 'When a professional contacts you, messages will appear here.',
        'dm.contact.error': 'Failed to load messages',
        'dm.contact.error.title': 'Something went wrong',
        'dm.status.disconnected': 'Disconnected',
        'dm.status.connecting': 'Connecting',
        'dm.status.open': 'Connected',
        'dm.type.worker': 'Professional',
        'dm.type.client': 'Client',
        'auth.try.again': 'Try again',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

// Mock directMessages store — controlled by each test
const mockStore = {
  conversations: [] as any[],
  loadInbox: vi.fn().mockResolvedValue(undefined),
  connect: vi.fn(),
  disconnect: vi.fn(),
  sseStatus: 'disconnected',
};

vi.mock('../src/store/directMessages', () => ({
  useDirectMessages: () => mockStore,
}));

// Suppress console log/error from logger
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('InboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.conversations = [];
    mockStore.loadInbox = vi.fn().mockResolvedValue(undefined);
    mockStore.sseStatus = 'disconnected';
  });

  afterEach(() => {
    cleanup();
  });

  it('shows loading spinner initially', () => {
    // loadInbox never resolves — keeps loading state
    mockStore.loadInbox = vi.fn(() => new Promise(() => {}));

    render(<InboxPage />);

    expect(screen.getByText('Disconnected')).toBeTruthy();
    // Spinner is rendered inside a <div class="spinner" />
    const spinners = document.querySelectorAll('.spinner');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('shows empty state when no conversations', async () => {
    mockStore.loadInbox = vi.fn().mockResolvedValue(undefined);

    render(<InboxPage />);

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeTruthy();
    });
  });

  it('shows error state when loadInbox fails', async () => {
    mockStore.loadInbox = vi.fn().mockRejectedValue(new Error('network down'));

    render(<InboxPage />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeTruthy();
      expect(screen.getByText('Failed to load messages')).toBeTruthy();
    });
  });

  it('renders conversation list when conversations exist', async () => {
    mockStore.loadInbox = vi.fn().mockResolvedValue(undefined);
    mockStore.conversations = [
      {
        id: 'conv-1',
        other_party: { id: 'w-1', name: 'PlumbCo', type: 'worker' },
        last_message: { preview: 'Hi, I can fix that', at: '2026-01-01T00:00:00Z' },
        unread_count: 2,
        status: 'active',
      },
      {
        id: 'conv-2',
        other_party: { id: 'w-2', name: 'ElectroFix', type: 'worker' },
        last_message: { preview: 'When can you come?', at: '2026-01-02T00:00:00Z' },
        unread_count: 0,
        status: 'active',
      },
    ];

    render(<InboxPage />);

    await waitFor(() => {
      expect(screen.getByText('PlumbCo')).toBeTruthy();
      expect(screen.getByText('ElectroFix')).toBeTruthy();
      expect(screen.getByText('Hi, I can fix that')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy(); // unread badge
    });
  });

  it('shows party type badges', async () => {
    mockStore.loadInbox = vi.fn().mockResolvedValue(undefined);
    mockStore.conversations = [
      {
        id: 'conv-1',
        other_party: { id: 'w-1', name: 'PlumbCo', type: 'worker' },
        last_message: null,
        unread_count: 0,
        status: 'active',
      },
    ];

    render(<InboxPage />);

    await waitFor(() => {
      expect(screen.getByText('Professional')).toBeTruthy();
    });
  });

  it('retry button reloads inbox', async () => {
    // Use a single mock that fails first, then succeeds
    const loadMock = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(undefined);
    mockStore.loadInbox = loadMock;

    render(<InboxPage />);

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeTruthy();
    });

    const retryBtn = screen.getByText('Try again');
    retryBtn.click();

    expect(loadMock).toHaveBeenCalledTimes(2);
  });

  it('calls connect on mount and disconnect on unmount', () => {
    const { unmount } = render(<InboxPage />);

    expect(mockStore.connect).toHaveBeenCalledOnce();

    unmount();
    expect(mockStore.disconnect).toHaveBeenCalledOnce();
  });

  it('shows SSE status indicator', () => {
    mockStore.loadInbox = vi.fn(() => new Promise(() => {}));

    render(<InboxPage />);

    expect(screen.getByText('Disconnected')).toBeTruthy();
  });

  it('shows connected SSE status', () => {
    mockStore.sseStatus = 'open';
    mockStore.loadInbox = vi.fn(() => new Promise(() => {}));

    render(<InboxPage />);

    expect(screen.getByText('Connected')).toBeTruthy();
  });
});
