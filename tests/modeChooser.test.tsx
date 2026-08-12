import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import ModeChooser from '../src/ModeChooser';

// Mock preact-router route
const mockRoute = vi.fn();
vi.mock('preact-router', () => ({
  route: (...args: unknown[]) => mockRoute(...args),
}));

// Mock i18n — provide translations matching what ModeChooser expects
vi.mock('../src/i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'chooser.worker.label': 'I want to offer my services',
        'chooser.worker.desc': 'Create your profile and get matched with clients',
        'chooser.client.label': 'I need to hire a professional',
        'chooser.client.desc': 'Tell us what you need and find the right help',
        'chooser.search.label': 'Search for a professional',
        'chooser.search.desc': 'Browse profiles and find the right professional',
        'chooser.title': 'What would you like to do?',
        'chooser.desc': 'Choose an option to get started',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

// Suppress console log from logger
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('ModeChooser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the chooser header with title and description', () => {
    render(<ModeChooser />);

    expect(screen.getByText('What would you like to do?')).toBeTruthy();
    expect(screen.getByText('Choose an option to get started')).toBeTruthy();
  });

  it('renders three mode cards', () => {
    render(<ModeChooser />);

    expect(screen.getByText('I want to offer my services')).toBeTruthy();
    expect(screen.getByText('I need to hire a professional')).toBeTruthy();
    expect(screen.getByText('Search for a professional')).toBeTruthy();
  });

  it('navigates to /chat?mode=worker_intake when worker card is clicked', () => {
    render(<ModeChooser />);

    const workerBtn = screen.getByText('I want to offer my services').closest('button');
    fireEvent.click(workerBtn!);

    expect(mockRoute).toHaveBeenCalledWith('/chat?mode=worker_intake', false);
  });

  it('navigates to /chat?mode=client_intake when client card is clicked', () => {
    render(<ModeChooser />);

    const clientBtn = screen.getByText('I need to hire a professional').closest('button');
    fireEvent.click(clientBtn!);

    expect(mockRoute).toHaveBeenCalledWith('/chat?mode=client_intake', false);
  });

  it('navigates to /find when search card is clicked', () => {
    render(<ModeChooser />);

    const searchBtn = screen.getByText('Search for a professional').closest('button');
    fireEvent.click(searchBtn!);

    expect(mockRoute).toHaveBeenCalledWith('/find', false);
  });

  it('renders icons for each mode', () => {
    render(<ModeChooser />);

    expect(screen.getByText('🔧')).toBeTruthy();
    expect(screen.getByText('🏠')).toBeTruthy();
    expect(screen.getByText('🔍')).toBeTruthy();
  });
});
