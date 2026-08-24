import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/preact';
import WorkerContactPage from '../src/pages/WorkerContactPage';

vi.mock('preact-router', () => ({ route: vi.fn() }));
import { route } from 'preact-router';

vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    lang: 'en',
    setLang: vi.fn(),
    t: (key: string) => {
      const map: Record<string, string> = {
        'dm.contact.error.title': 'Something went wrong',
        'dm.contact.error': 'Could not start the conversation',
        'dm.contact.back': 'Back to search',
        'dm.contact.loading': 'Starting conversation…',
      };
      return map[key] || key;
    },
  }),
}));

const getContact = vi.fn();
vi.mock('../src/lib/directMessageApi', () => ({
  getContact: (...a: unknown[]) => getContact(...a),
}));

vi.spyOn(console, 'error').mockImplementation(() => {});

describe('WorkerContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the loading spinner while contacting', () => {
    getContact.mockReturnValue(new Promise(() => {}));
    render(<WorkerContactPage workerId="w-1" />);
    expect(document.querySelector('.spinner')).toBeTruthy();
    expect(screen.getByText('Starting conversation…')).toBeTruthy();
  });

  it('routes to the thread when a conversation id is returned', async () => {
    getContact.mockResolvedValue({ conversation_id: 'conv-9' });
    render(<WorkerContactPage workerId="w-1" />);
    await waitFor(() => expect(route).toHaveBeenCalledWith('/inbox/conv-9', true));
  });

  it('stays on loading when no conversation_id comes back', async () => {
    getContact.mockResolvedValue({});
    render(<WorkerContactPage workerId="w-1" />);
    await waitFor(() => expect(getContact).toHaveBeenCalled());
    expect(route).not.toHaveBeenCalled();
    expect(document.querySelector('.spinner')).toBeTruthy();
  });

  it('shows the error state with a back button on failure', async () => {
    getContact.mockRejectedValue(new Error('worker unreachable'));
    render(<WorkerContactPage workerId="w-1" />);

    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeTruthy());
    expect(screen.getByText('worker unreachable')).toBeTruthy();

    (screen.getByText('Back to search') as HTMLButtonElement).click();
    expect(route).toHaveBeenCalledWith('/find', false);
  });
});
