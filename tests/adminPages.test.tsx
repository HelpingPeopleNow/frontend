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

const promptsService = {
  getSystemPrompts: vi.fn(),
  updateLlmProviders: vi.fn(),
  updateSystemPromptColumn: vi.fn(),
};
vi.mock('../src/services/systemPrompts', () => ({
  getSystemPrompts: (...a: unknown[]) => promptsService.getSystemPrompts(...a),
  updateLlmProviders: (...a: unknown[]) => promptsService.updateLlmProviders(...a),
  updateSystemPromptColumn: (...a: unknown[]) => promptsService.updateSystemPromptColumn(...a),
}));

const promptDTO = {
  worker_profile_prompt: 'worker prompt text',
  client_profile_prompt: 'client prompt text',
  find_trader_search_prompt: 'search prompt text',
  find_trader_presentation_prompt: 'presentation prompt text',
  llm_providers: ['mistral'],
  updated_at: '2026-01-01T00:00:00Z',
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
    promptsService.updateLlmProviders.mockResolvedValue({ ...promptDTO, llm_providers: [] });
  });

  afterEach(() => cleanup());

  it('loads and checks the current providers', async () => {
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes.length).toBe(6);
    const mistralBox = checkboxes.find(cb => {
      const row = cb.closest('tr');
      return row && row.textContent && row.textContent.includes('Mistral');
    });
    await waitFor(() => expect(mistralBox?.checked).toBe(true));
    expect(screen.queryByText(/providers updated/)).toBeNull();
  });

  it('falls back to empty selection when llm_providers is null', async () => {
    promptsService.getSystemPrompts.mockResolvedValue({ ...promptDTO, llm_providers: null });
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach(cb => expect(cb.checked).toBe(false));
  });

  it('toggles a checkbox and saves the providers array', async () => {
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    const ollamaRow = screen.getAllByRole('row').find(r => r.textContent?.includes('Ollama'));
    fireEvent.click(ollamaRow!);
    fireEvent.click(screen.getByText('admin.save'));

    await waitFor(() =>
      expect(promptsService.updateLlmProviders).toHaveBeenCalledWith(
        expect.arrayContaining(['mistral', 'ollama'])
      )
    );
    await waitFor(() => expect(screen.getByText(/✓ LLM providers updated/)).toBeTruthy());
  });

  it('shows ollama message when only ollama is selected', async () => {
    promptsService.getSystemPrompts.mockResolvedValue({ ...promptDTO, llm_providers: [] });
    promptsService.updateLlmProviders.mockResolvedValue({ ...promptDTO, llm_providers: ['ollama'] });
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    fireEvent.click(screen.getByText('admin.save'));
    await waitFor(() =>
      expect(screen.getByText(/LLM providers updated: ollama/)).toBeTruthy()
    );
  });

  it('shows an error message when saving fails with ApiError', async () => {
    promptsService.updateLlmProviders.mockRejectedValue(new ApiError(500, 'backend exploded'));
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    fireEvent.click(screen.getByText('admin.save'));
    await waitFor(() => {
      expect(screen.getByText('✕ backend exploded')).toBeTruthy();
    });
  });

  it('re-enables the save button after a failed save (saving state cleared)', async () => {
    promptsService.updateLlmProviders.mockRejectedValue(new Error('boom'));
    render(<AdminLLMPage />);
    await waitFor(() => expect(promptsService.getSystemPrompts).toHaveBeenCalled());

    const btn = screen.getByText('admin.save') as HTMLButtonElement;
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/✕ boom/)).toBeTruthy());
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
