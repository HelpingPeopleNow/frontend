import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/preact';
import DirectMessagePage from '../src/pages/DirectMessagePage';

// jsdom lacks Element.scrollTo
beforeAll(() => {
  Element.prototype.scrollTo = () => {};
});

vi.mock('../src/AppShell', () => ({
  default: ({ children }: { children: preact.ComponentChildren }) => children,
}));

vi.mock('preact-router', () => ({ route: vi.fn() }));
import { route } from 'preact-router';

vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    lang: 'en',
    setLang: vi.fn(),
    t: (key: string) => {
      const map: Record<string, string> = {
        'dm.thread.unknown': 'Unknown',
        'dm.block': 'Blocked',
        'dm.report': 'Report',
        'dm.archive': 'Archive',
        'dm.block.desc': 'This conversation will be blocked.',
        'dm.block.title': 'Block',
        'dm.report.desc': 'Report this conversation?',
        'dm.report.title': 'Report',
        'dm.contact.error': 'Action failed',
        'admin.cancel': 'Cancel',
        'dm.rate.limited': 'Slow down — rate limited',
        'dm.thread.empty': 'No messages yet',
        'dm.placeholder': 'Type a message',
      };
      return map[key] || key;
    },
  }),
}));

const authState = { session: { user: { id: 'me-1' } } as unknown };
vi.mock('../src/AuthProvider', () => ({
  useAuth: () => authState,
}));

const mockStore = {
  messagesByConv: {} as Record<string, any[]>,
  conversations: [] as any[],
  loadMessages: vi.fn().mockResolvedValue(undefined),
  loadInbox: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  markRead: vi.fn(),
  rateLimited: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  setActiveConv: vi.fn(),
};
vi.mock('../src/store/directMessages', () => ({
  useDirectMessages: () => mockStore,
}));

const dmApi = {
  archiveConversation: vi.fn().mockResolvedValue(undefined),
  blockConversation: vi.fn().mockResolvedValue(undefined),
  reportConversation: vi.fn().mockResolvedValue(undefined),
};
vi.mock('../src/lib/directMessageApi', () => ({
  archiveConversation: (...a: unknown[]) => dmApi.archiveConversation(...a),
  blockConversation: (...a: unknown[]) => dmApi.blockConversation(...a),
  reportConversation: (...a: unknown[]) => dmApi.reportConversation(...a),
}));

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const CONV = 'conv-1';
const conversation = {
  id: CONV,
  other_party: { id: 'w-1', name: 'PlumbCo', type: 'worker' },
  status: 'active',
};

function renderPage() {
  return render(<DirectMessagePage convId={CONV} />);
}

describe('DirectMessagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.messagesByConv = {};
    mockStore.conversations = [conversation];
    mockStore.rateLimited = false;
    mockStore.sendMessage.mockResolvedValue(undefined);
    dmApi.archiveConversation.mockResolvedValue(undefined);
    dmApi.blockConversation.mockResolvedValue(undefined);
    dmApi.reportConversation.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('loads thread on mount, sets active conv, connects SSE; cleanup on unmount', async () => {
    const { unmount } = renderPage();
    await waitFor(() => expect(mockStore.loadMessages).toHaveBeenCalledWith(CONV));
    expect(mockStore.loadInbox).toHaveBeenCalled();
    expect(mockStore.markRead).toHaveBeenCalledWith(CONV);
    expect(mockStore.setActiveConv).toHaveBeenCalledWith(CONV);
    expect(mockStore.connect).toHaveBeenCalledOnce();

    unmount();
    expect(mockStore.setActiveConv).toHaveBeenLastCalledWith(null);
    expect(mockStore.disconnect).toHaveBeenCalledOnce();
  });

  it('shows the empty state when no messages exist', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('No messages yet')).toBeTruthy());
  });

  it('renders sent and received bubbles distinguished by sender', async () => {
    mockStore.messagesByConv = {
      [CONV]: [
        { id: 'm-1', sender_id: 'me-1', body: 'hello from me', created_at: '2026-01-01T10:00:00Z' },
        { id: 'm-2', sender_id: 'w-1', body: 'hi back', created_at: '2026-01-01T10:01:00Z' },
      ],
    };
    renderPage();
    await waitFor(() => expect(screen.getByText('hello from me')).toBeTruthy());
    expect(document.querySelector('.dm-msg-sent')).toBeTruthy();
    expect(document.querySelector('.dm-msg-recv')).toBeTruthy();
  });

  it('sends a typed message and clears the input', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByPlaceholderText('Type a message')).toBeTruthy());

    const input = screen.getByPlaceholderText('Type a message') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'fix my sink please' } });
    fireEvent.click(screen.getByText('↑'));

    await waitFor(() => expect(mockStore.sendMessage).toHaveBeenCalledWith(CONV, 'fix my sink please'));
    expect(input.value).toBe('');
  });

  it('sends on Enter without shift', async () => {
    renderPage();
    const input = await waitFor(() => screen.getByPlaceholderText('Type a message') as HTMLInputElement);

    fireEvent.input(input, { target: { value: 'enter send' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => expect(mockStore.sendMessage).toHaveBeenCalledWith(CONV, 'enter send'));
  });

  it('shows an error when sendMessage rejects and clears it on click', async () => {
    mockStore.sendMessage.mockRejectedValue(new Error('429'));
    renderPage();
    const input = await waitFor(() => screen.getByPlaceholderText('Type a message') as HTMLInputElement);

    fireEvent.input(input, { target: { value: 'will fail' } });
    fireEvent.click(screen.getByText('↑'));

    const banner = await waitFor(() => screen.getByText(/Failed to send message/));
    fireEvent.click(banner);
    expect(screen.queryByText(/Failed to send message/)).toBeNull();
  });

  it('shows the rate-limit banner when rateLimited is set', () => {
    mockStore.rateLimited = true;
    renderPage();
    expect(screen.getByText(/Slow down — rate limited/)).toBeTruthy();
  });

  it('falls back to "Unknown" for conversations missing from the store', () => {
    mockStore.conversations = [];
    renderPage();
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('opens the action menu and archives (navigates to /inbox)', async () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Report')); // ⋯ button
    expect(screen.getByText(/Archive/)).toBeTruthy();

    fireEvent.click(screen.getByText(/Archive/));
    await waitFor(() => expect(dmApi.archiveConversation).toHaveBeenCalledWith(CONV));
    expect(route).toHaveBeenCalledWith('/inbox', false);
  });

  it('blocks after confirmation', async () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Report'));
    fireEvent.click(screen.getByText(/🚫/));

    // Confirmation dialog appears
    expect(screen.getByText('This conversation will be blocked.')).toBeTruthy();
    fireEvent.click(screen.getByText('Block'));

    await waitFor(() => expect(dmApi.blockConversation).toHaveBeenCalledWith(CONV));
    // Dialog closed again
    expect(screen.queryByText('This conversation will be blocked.')).toBeNull();
  });

  it('reports after confirmation', async () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Report'));
    fireEvent.click(screen.getByText(/⚠️/));

    expect(screen.getByText('Report this conversation?')).toBeTruthy();
    fireEvent.click(screen.getByText('Report', { selector: '.btn-danger' }));

    await waitFor(() => expect(dmApi.reportConversation).toHaveBeenCalledWith(CONV));
  });

  it('cancelling a confirmation dialog closes it', async () => {
    renderPage();
    fireEvent.click(screen.getByTitle('Report'));
    fireEvent.click(screen.getByText(/🚫/));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('This conversation will be blocked.')).toBeNull();
  });

  it('sets an error banner when block fails', async () => {
    dmApi.blockConversation.mockRejectedValue(new Error('nope'));
    renderPage();
    fireEvent.click(screen.getByTitle('Report'));
    fireEvent.click(screen.getByText(/🚫/));
    fireEvent.click(screen.getByText('Block'));

    await waitFor(() => expect(screen.getByText('Action failed')).toBeTruthy());
  });

  it('blocked conversations hide the composer and show the blocked notice', () => {
    mockStore.conversations = [{ ...conversation, status: 'blocked' }];
    renderPage();
    expect(screen.queryByPlaceholderText('Type a message')).toBeNull();
    expect(screen.getAllByText(/blocked/i).length).toBeGreaterThan(0);
  });
});
