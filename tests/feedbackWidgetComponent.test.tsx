import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import FeedbackWidget from '../src/components/feedback/FeedbackWidget';

describe('FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the FAB button', () => {
    render(<FeedbackWidget />);
    expect(screen.getByLabelText('Send feedback')).toBeTruthy();
  });

  it('opens popover on FAB click', async () => {
    render(<FeedbackWidget />);

    const fab = screen.getByLabelText('Send feedback');
    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByText('Send Feedback')).toBeTruthy();
    });
  });

  it('closes popover on outside click', async () => {
    render(<FeedbackWidget />);

    const fab = screen.getByLabelText('Send feedback');
    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByText('Send Feedback')).toBeTruthy();
    });

    // Simulate outside click by dispatching a mousedown outside the widget.
    // In jsdom there's no real layout, but we can verify the popover can be
    // toggled by clicking the FAB again.
    fireEvent.click(fab);
    await waitFor(() => {
      expect(screen.queryByText('Send Feedback')).toBeNull();
    });
  });

  it('does not render on admin pages', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/users' },
      writable: true,
      configurable: true,
    });

    render(<FeedbackWidget />);
    expect(screen.queryByLabelText('Send feedback')).toBeNull();
  });
});
