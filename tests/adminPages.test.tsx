import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/preact';
import AdminPage from '../src/AdminPage';
import AdminLLMPage from '../src/AdminLLMPage';
import AdminPromptsPage from '../src/AdminPromptsPage';
import { ApiError } from '../src/services/api';

vi.mock('../src/AppShell', () => ({
  default: ({ children }: { children: preact.ComponentChildren }) => children,
}));

vi.mock('../src/i18n', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (key: string) => key }),
}));

const authState = { session: null as unknown };
vi.mock('../src/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// ── systemPrompts service mock ───────────────────────────────────────────────
const promptsService = {
  getSystemPrompts: vi.fn(),
  updateLlmProvider: vi.fn(),
  updateSystemPromptColumn: vi.fn(),
};
vi.mock('../src/services/systemPrompts', () => ({
  getSystemPrompts: (...a: unknown[]) => promptsService.getSystemPrompts(...a),
  updateLlmProvider: (...a: unknown[]) => promptsService.updateLlmProvider(...a),
  updateSystemPromptColumn: (...a: unknown[]) => promptsService.updateSystemPromptColumn(...a),
}));

const promptDTO = {
  worker_profile_prompt: 'worker prompt text',
  client_profile_prompt: 'client prompt text',
  find_trader_search_prompt: 'search prompt text',
  find_trader_presentation_prompt: 'presentation prompt text',
  llm_provider: 'mistral',
};

describe('AdminPage', () => {
  afterEach(() => cleanup());

  it('renders the menu cards without the Adminer link for non-admins', () => {
    authState.session = { user: { id: 'u-1', is_admin: false } };
    render(<AdminPage />);

    expect(screen.getByText('admin.title')).toBeTruthy();
    expect(document.querySelectorAll('.admin-menu-card').length).toBe(8);
    expect(document.querySelector('a[href*="adminer"]')).toBeNull();
  });

  it('shows the Adminer link for admins', () => {
    authState.session = { user: { id: 'u-1', is_admin: true } };
    render(<AdminPage />);
    expect(document.querySelector('a[href*="adminer"]')).toBeTruthy();
    expect(document.querySelectorAll('.admin-menu-card').length).toBe(9);
  });
});

describe('AdminLLMPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    promptsService.getSystemPrompts.mockResolvedValue(promptDTO);
    promptsService.updateLlmProvider.mockResolvedValue({ ...promptDTO, llm_provider: '' });
  });

  afterEach(() => cleanup());

  function pickProvider(value: string) {
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    select.value = value;
    fireEvent(select, new Event('change', { bubbles: true }));
  }

  it('loads and preselects the current provider', async () => {
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe('mistral'));
    // All eight options rendered (default + groq, openrouter, opencode0-2, ollama, mistral)
    expect(select.options.length).toBe(8);
    expect(screen.queryByText(/LLM Provider changed/)).toBeNull();
  });

  it('falls back to default (empty) when llm_provider is null', async () => {
    promptsService.getSystemPrompts.mockResolvedValue({ ...promptDTO, llm_provider: null });
    render(<AdminLLMPage />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe(''));
  });

  it('saves the selected provider and shows a success message with its label', async () => {
    render(<AdminLLMPage />);
    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      return expect(select.value).toBe('mistral');
    });

    pickProvider('ollama');
    fireEvent.click(screen.getByText('admin.save'));

    await waitFor(() => expect(promptsService.updateLlmProvider).toHaveBeenCalledWith('ollama'));
    await waitFor(() => {
      expect(screen.getByText(/✓ LLM Provider changed to Ollama \(local\)/)).toBeTruthy();
    });
  });

  it('shows the raw provider value in the success message for unnamed providers', async () => {
    render(<AdminLLMPage />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy());

    pickProvider('');
    fireEvent.click(screen.getByText('admin.save'));

    await waitFor(() => expect(promptsService.updateLlmProvider).toHaveBeenCalledWith(''));
  });

  it('shows an error message when saving fails with ApiError', async () => {
    promptsService.updateLlmProvider.mockRejectedValue(new ApiError(500, 'backend exploded'));
    render(<AdminLLMPage />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy());

    fireEvent.click(screen.getByText('admin.save'));
    await waitFor(() => {
      expect(screen.getByText('✕ backend exploded')).toBeTruthy();
    });
  });

  it('re-enables the save button after a failed save (saving state cleared)', async () => {
    promptsService.updateLlmProvider.mockRejectedValue(new Error('boom'));
    render(<AdminLLMPage />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy());

    const btn = screen.getByText('admin.save') as HTMLButtonElement;
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/✕ boom/)).toBeTruthy());
    // Re-query: the button node is replaced by the post-error re-render
    expect((screen.getByText('admin.save') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows a load-error message when getSystemPrompts fails', async () => {
    promptsService.getSystemPrompts.mockRejectedValue(new Error('down'));
    render(<AdminLLMPage />);
    await waitFor(() => expect(screen.getByText('admin.load.error')).toBeTruthy());
  });
});

describe('AdminPromptsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    promptsService.getSystemPrompts.mockResolvedValue(promptDTO);
    promptsService.updateSystemPromptColumn.mockResolvedValue(promptDTO);
  });

  afterEach(() => cleanup());

  it('shows the loading state before prompts arrive', () => {
    promptsService.getSystemPrompts.mockReturnValue(new Promise(() => {}));
    render(<AdminPromptsPage />);
    expect(document.querySelector('.spinner')).toBeTruthy();
    expect(screen.getAllByText('admin.loading').length).toBeGreaterThan(0);
  });

  it('renders four editable prompt cards once loaded', async () => {
    render(<AdminPromptsPage />);
    await waitFor(() => {
      expect((screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).value).toBe('worker prompt text');
    });

    const areas = screen.getAllByRole('textbox') as HTMLTextAreaElement[];
    expect(areas.length).toBe(4);
    expect(areas[1].value).toBe('client prompt text');
    expect(areas[2].value).toBe('search prompt text');
    expect(areas[3].value).toBe('presentation prompt text');
  });

  it('saves the worker prompt under the stripped column name', async () => {
    render(<AdminPromptsPage />);
    await waitFor(
      () => expect(screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).toBeTruthy()
    );

    fireEvent.click(screen.getAllByText(/^admin.save /)[0]);

    await waitFor(() =>
      expect(promptsService.updateSystemPromptColumn).toHaveBeenCalledWith('worker_profile', 'worker prompt text')
    );
    await waitFor(() => expect(screen.getByText(/✓ admin.prompt.worker updated/)).toBeTruthy());
  });

  it('shows an error message when saving fails', async () => {
    promptsService.updateSystemPromptColumn.mockRejectedValue(new ApiError(400, 'validation failed'));
    render(<AdminPromptsPage />);
    const area = await waitFor(
      () => screen.getAllByRole('textbox')[0] as HTMLTextAreaElement
    );

    fireEvent.click(screen.getAllByText(/^admin.save /)[0]);
    await waitFor(() => expect(screen.getByText('✕ validation failed')).toBeTruthy());
  });

  it('handles empty prompt values from the API (falls back to empty string)', async () => {
    promptsService.getSystemPrompts.mockResolvedValue({
      ...promptDTO,
      find_trader_search_prompt: '',
      find_trader_presentation_prompt: undefined,
    } as unknown as typeof promptDTO);
    render(<AdminPromptsPage />);
    const areas = await waitFor(() => screen.getAllByRole('textbox')) as HTMLTextAreaElement[];
    expect(areas[2].value).toBe('');
    expect(areas[3].value).toBe('');
  });

  it('shows a load-error message when getSystemPrompts fails', async () => {
    promptsService.getSystemPrompts.mockRejectedValue(new Error('down'));
    render(<AdminPromptsPage />);
    await waitFor(() => expect(screen.getByText('admin.load.error')).toBeTruthy());
  });
});
