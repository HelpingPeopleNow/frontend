import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/preact';
import FeedbackAdminPage from '../src/FeedbackAdminPage';

const mockFeedbackItems = [
  {
    id: 'fb-1',
    user_id: 'user-abc-123',
    page_url: '/chat',
    message: 'Bug report',
    category: 'bug',
    status: 'open',
    admin_note: null,
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'fb-2',
    user_id: 'user-def-456',
    page_url: '/find',
    message: 'Great idea',
    category: 'idea',
    status: 'resolved',
    admin_note: 'Planned',
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-10T00:00:00Z',
  },
];

describe('FeedbackAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the feedback list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFeedbackItems),
    } as Response);

    render(<FeedbackAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Bug report')).toBeTruthy();
    });

    expect(screen.getByText('Great idea')).toBeTruthy();
  });

  it('shows empty state when no feedback exists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);

    render(<FeedbackAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('No feedback found.')).toBeTruthy();
    });
  });

  it('shows error banner on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<FeedbackAdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load feedback/)).toBeTruthy();
    });
  });

  it('calls updateStatus when status button clicked', async () => {
    let updateCalled = false;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('admin/feedback') && url.includes('id=')) {
        updateCalled = true;
        return Promise.resolve({ ok: true, status: 200 } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockFeedbackItems),
      } as Response);
    });

    render(<FeedbackAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Bug report')).toBeTruthy();
    });

    const inProgressBtn = screen.getAllByText('in progress').find(el => el.tagName === 'BUTTON');
    if (!inProgressBtn) throw new Error('in progress button not found');
    fireEvent.click(inProgressBtn);

    expect(updateCalled).toBe(true);
  });
});
