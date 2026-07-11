import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import FeedbackPopover from '../src/components/feedback/FeedbackPopover';

// Mock the API module.
vi.mock('../src/lib/feedbackApi', () => ({
  submitFeedback: vi.fn().mockResolvedValue({ id: 'test-id', status: 'open' }),
}));

describe('FeedbackPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the form with all elements', () => {
    render(<FeedbackPopover />);

    expect(screen.getByText('Send Feedback')).toBeTruthy();
    expect(screen.getByText('Help us improve the platform')).toBeTruthy();
    expect(screen.getByText('🐛 Bug')).toBeTruthy();
    expect(screen.getByText('💡 Idea')).toBeTruthy();
    expect(screen.getByText('😤 Complaint')).toBeTruthy();
    expect(screen.getByText('💬 General')).toBeTruthy();
    expect(screen.getByPlaceholderText(/What's on your mind/)).toBeTruthy();
    expect(screen.getByText('Send')).toBeTruthy();
    expect(screen.getByText('0/2000')).toBeTruthy();
  });

  it('selects a category', () => {
    render(<FeedbackPopover />);

    const bugBtn = screen.getByText('🐛 Bug');
    fireEvent.click(bugBtn);

    expect(bugBtn.className).toContain('active');
    // General should no longer be active.
    const generalBtn = screen.getByText('💬 General');
    expect(generalBtn.className).not.toContain('active');
  });

  it('disables submit when message is empty', () => {
    render(<FeedbackPopover />);

    const submitBtn = screen.getByText('Send');
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('enables submit when message is non-empty', () => {
    render(<FeedbackPopover />);

    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    fireEvent.input(textarea, { target: { value: 'Great platform!' } });

    const submitBtn = screen.getByText('Send');
    expect(submitBtn.hasAttribute('disabled')).toBe(false);
  });

  it('shows success message after submit', async () => {
    const onSubmit = vi.fn();
    render(<FeedbackPopover onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    fireEvent.input(textarea, { target: { value: 'Bug report' } });

    const submitBtn = screen.getByText('Send');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Thanks for your feedback!')).toBeTruthy();
    });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('updates character count', () => {
    render(<FeedbackPopover />);

    const textarea = screen.getByPlaceholderText(/What's on your mind/);
    fireEvent.input(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5/2000')).toBeTruthy();
  });
});
