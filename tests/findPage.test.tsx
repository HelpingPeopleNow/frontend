import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/preact';
import FindPage from '../src/FindPage';

// ── Mocks ──────────────────────────────────────────────────────────────────

// AppShell just renders children
vi.mock('../src/AppShell', () => ({
  default: ({ children }: { children: preact.ComponentChildren }) => children,
}));

// i18n
vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'find.title': 'Find a Professional',
        'find.welcome.title': 'Search for trusted professionals',
        'find.welcome.desc': 'Describe your need and we\'ll find matches near you.',
        'find.placeholder': 'Describe what you need...',
        'chat.role.assistant': 'Assistant',
        'chat.error.network': 'Network error. Please try again.',
        'chat.location.denied': 'Location access denied',
        'chat.mic.start': 'Start voice input',
        'chat.mic.stop': 'Stop voice input',
        'chat.mic.listening': 'Listening...',
        'chat.mic.unavailable': 'Microphone unavailable',
        'client.find.no_results': 'No professionals found matching your search.',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

// Geolocation
const mockGeo = {
  latitude: null as number | null,
  longitude: null as number | null,
  loading: false,
  permissionDenied: false,
  error: null as string | null,
};
vi.mock('../src/hooks/useGeolocation', () => ({
  useGeolocation: () => mockGeo,
}));

// Chat init
const mockChatInit = {
  initialMessages: [] as { role: 'user' | 'assistant'; text: string; workers?: unknown[] }[],
  initialConversationId: null as string | null,
  loading: false,
};
vi.mock('../src/hooks/useChatInit', () => ({
  useChatInit: () => mockChatInit,
}));

// Speech recognition
const mockSpeech = {
  isSupported: false,
  isListening: false,
  toggle: vi.fn(),
  transcript: '',
  error: null as string | null,
};
vi.mock('../src/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => mockSpeech,
}));

// Speech input merge
vi.mock('../src/lib/speechInput', () => ({
  mergeSpeechTranscript: (base: string, t: string) => base + t,
}));

// Chat service
const mockSendChat = vi.fn();
vi.mock('../src/services/chat', () => ({
  sendChat: (...args: unknown[]) => mockSendChat(...args),
  WorkerCard: null, // not used directly in tests
}));

// WorkerCard component — renders as identifiable div
vi.mock('../src/components/chat/WorkerCard', () => ({
  default: ({ worker }: { worker: { id: string; business_name: string; profession: string } }) => (
    <div class="worker-card-mock" data-worker-id={worker.id}>
      {worker.business_name} — {worker.profession}
    </div>
  ),
}));

// Suppress console
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Helpers ────────────────────────────────────────────────────────────────

function mockChatResponse(answer: string, workers?: { id: string; business_name: string; profession: string }[], convId?: string) {
  mockSendChat.mockResolvedValue({
    ok: true,
    json: async () => ({ answer, workers, conversation_id: convId }),
  });
}

function mockChatError(status: number) {
  mockSendChat.mockResolvedValue({ ok: false, status });
}

function mockChatNetworkError() {
  mockSendChat.mockRejectedValue(new Error('Failed to fetch'));
}

function resetAll() {
  vi.clearAllMocks();
  mockGeo.latitude = null;
  mockGeo.longitude = null;
  mockGeo.loading = false;
  mockGeo.permissionDenied = false;
  mockGeo.error = null;
  mockChatInit.initialMessages = [];
  mockChatInit.initialConversationId = null;
  mockChatInit.loading = false;
  mockSpeech.isSupported = false;
  mockSpeech.isListening = false;
  mockSpeech.transcript = '';
  mockSpeech.error = null;
  mockSendChat.mockReset();
}

beforeEach(() => {
  resetAll();
  // jsdom doesn't implement scrollTo — polyfill it
  Element.prototype.scrollTo = vi.fn() as unknown as (options?: ScrollToOptions) => void;
});
afterEach(cleanup);

// ── Tests ──────────────────────────────────────────────────────────────────

describe('FindPage', () => {
  describe('initial render', () => {
    it('renders the welcome screen with title and description', () => {
      render(<FindPage />);

      expect(screen.getByText('Search for trusted professionals')).toBeTruthy();
      expect(screen.getByText("Describe your need and we'll find matches near you.")).toBeTruthy();
    });

    it('renders the search input', () => {
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      expect(input).toBeTruthy();
      expect((input as HTMLInputElement).disabled).toBe(false);
    });

    it('renders the send button', () => {
      render(<FindPage />);

      const sendBtn = screen.getByText('↑');
      expect(sendBtn).toBeTruthy();
      expect(sendBtn.hasAttribute('disabled')).toBe(true); // empty input
    });

    it('send button is disabled when input is empty', () => {
      render(<FindPage />);

      const sendBtn = screen.getByText('↑');
      expect(sendBtn.hasAttribute('disabled')).toBe(true);
    });

    it('send button enables when input has text', () => {
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });

      const sendBtn = screen.getByText('↑');
      expect(sendBtn.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('sending messages', () => {
    it('shows user message and loading indicator after send', async () => {
      // Use a delayed promise so we can observe the loading state
      let resolveChat: (value: unknown) => void;
      mockSendChat.mockReturnValue(new Promise(resolve => { resolveChat = resolve; }));
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      // User message appears
      await waitFor(() => {
        expect(screen.getByText('electrician')).toBeTruthy();
      });

      // Loading indicator (typing dots) appears while request is in-flight
      const dots = document.querySelectorAll('.chat-typing-dot');
      expect(dots.length).toBe(3);

      // Clean up: resolve the promise so component unmounts cleanly
      resolveChat!({ ok: true, json: async () => ({ answer: 'done', workers: undefined }) });
    });

    it('shows assistant response after API success', async () => {
      mockChatResponse('I found several electricians near you.');
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      await waitFor(() => {
        expect(screen.getByText('I found several electricians near you.')).toBeTruthy();
      });
    });

    it('shows worker cards when API returns workers', async () => {
      mockChatResponse('Here are some electricians:', [
        { id: 'w-1', business_name: 'SparkyCo', profession: 'Electrician' },
        { id: 'w-2', business_name: 'WireWorks', profession: 'Electrician' },
      ]);
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      await waitFor(() => {
        expect(screen.getByText('SparkyCo — Electrician')).toBeTruthy();
        expect(screen.getByText('WireWorks — Electrician')).toBeTruthy();
      });
    });

    it('shows no-results message when API returns empty workers array', async () => {
      mockChatResponse('No results found.', []);
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'something obscure' } });
      fireEvent.click(screen.getByText('↑'));

      await waitFor(() => {
        expect(screen.getByText('No professionals found matching your search.')).toBeTruthy();
      });
    });

    it('shows error when API returns non-OK status', async () => {
      mockChatError(500);
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      await waitFor(() => {
        expect(screen.getByText('Error 500')).toBeTruthy();
      });
    });

    it('shows network error when fetch throws', async () => {
      mockChatNetworkError();
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeTruthy();
      });
    });

    it('prevents sending while a request is in-flight', async () => {
      // Never resolve — simulates in-flight request
      mockSendChat.mockReturnValue(new Promise(() => {}));
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'electrician' } });
      fireEvent.click(screen.getByText('↑'));

      // Input should be cleared and button disabled while loading
      await waitFor(() => {
        expect((input as HTMLInputElement).disabled).toBe(true);
      });
    });

    it('sends on Enter key', () => {
      mockChatResponse('response');
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'plumber' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      expect(mockSendChat).toHaveBeenCalled();
    });

    it('does not send on Shift+Enter', () => {
      render(<FindPage />);

      const input = screen.getByPlaceholderText('Describe what you need...');
      fireEvent.input(input, { target: { value: 'plumber' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockSendChat).not.toHaveBeenCalled();
    });
  });

  describe('geolocation', () => {
    it('shows location denied banner when permission is denied', () => {
      mockGeo.permissionDenied = true;

      render(<FindPage />);

      expect(screen.getByText(/Location access denied/)).toBeTruthy();
    });

    it('does not show banner while geo is loading', () => {
      mockGeo.loading = true;
      mockGeo.permissionDenied = true;

      render(<FindPage />);

      expect(screen.queryByText(/Location access denied/)).toBeNull();
    });
  });

  describe('speech recognition', () => {
    it('shows mic button when speech recognition is supported', () => {
      mockSpeech.isSupported = true;

      render(<FindPage />);

      const micBtn = screen.getByLabelText('Start voice input');
      expect(micBtn).toBeTruthy();
    });

    it('does not show mic button when not supported', () => {
      mockSpeech.isSupported = false;

      render(<FindPage />);

      expect(screen.queryByLabelText('Start voice input')).toBeNull();
    });

    it('shows voice unavailable banner when speech error is set', () => {
      mockSpeech.isSupported = true;
      mockSpeech.error = 'not-allowed';

      render(<FindPage />);

      expect(screen.getByText('Microphone unavailable')).toBeTruthy();
    });

    it('shows recording state when listening', () => {
      mockSpeech.isSupported = true;
      mockSpeech.isListening = true;

      render(<FindPage />);

      expect(screen.getByLabelText('Stop voice input')).toBeTruthy();
    });
  });

  describe('initial loading', () => {
    it('shows messages when chat init returns previous conversation', () => {
      mockChatInit.initialMessages = [
        { role: 'user', text: 'plumber' },
        { role: 'assistant', text: 'Here are plumbers near you.' },
      ];

      render(<FindPage />);

      expect(screen.getByText('plumber')).toBeTruthy();
      expect(screen.getByText('Here are plumbers near you.')).toBeTruthy();
      // Welcome screen should not be visible
      expect(screen.queryByText('Search for trusted professionals')).toBeNull();
    });
  });
});
