import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/preact';
import { h } from 'preact';
import { AuthProvider, useAuth } from '../src/AuthProvider';

const authMocks = {
  getSession: vi.fn(),
  sendMagicLink: vi.fn(),
  logout: vi.fn(),
};
vi.mock('../src/auth', () => ({
  getSession: (...a: unknown[]) => authMocks.getSession(...a),
  sendMagicLink: (...a: unknown[]) => authMocks.sendMagicLink(...a),
  logout: (...a: unknown[]) => authMocks.logout(...a),
}));

vi.mock('../src/i18n', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (key: string) => key }),
}));

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

let captured: ReturnType<typeof useAuth> | null = null;
function Probe() {
  captured = useAuth();
  return <div data-testid="probe">probe</div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('loads an existing session on mount', async () => {
    const session = { user: { id: 'u-1' } };
    authMocks.getSession.mockResolvedValue(session);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    // loading until getSession resolves
    expect(captured!.loading).toBe(true);

    await waitFor(() => {
      expect(captured!.loading).toBe(false);
    });
    expect(captured!.session).toEqual(session);
    expect(captured!.error).toBe(false);
    expect(authMocks.getSession).toHaveBeenCalledOnce();
  });

  it('ends with a null session and no error when not signed in', async () => {
    authMocks.getSession.mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(captured!.loading).toBe(false));
    expect(captured!.session).toBeNull();
    expect(captured!.error).toBe(false);
  });

  it('sets the error flag when the session check rejects (auth service down)', async () => {
    authMocks.getSession.mockRejectedValue(new Error('service down'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(captured!.loading).toBe(false));
    expect(captured!.session).toBeNull();
    expect(captured!.error).toBe(true);
  });

  it('sendMagicLink forwards email + capToken + lang', async () => {
    authMocks.getSession.mockResolvedValue(null);
    authMocks.sendMagicLink.mockResolvedValue({ ok: true });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(captured!.loading).toBe(false));

    await act(async () => {
      const res = await captured!.sendMagicLink('a@b.c', 'cap-token-123');
      expect(res).toEqual({ ok: true });
    });
    expect(authMocks.sendMagicLink).toHaveBeenCalledWith('a@b.c', 'cap-token-123', 'en');
  });

  it('logout clears the session and error flag', async () => {
    const session = { user: { id: 'u-1' } };
    authMocks.getSession.mockResolvedValue(session);
    authMocks.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(captured!.session).toEqual(session));

    await act(async () => {
      await captured!.logout();
    });
    expect(authMocks.logout).toHaveBeenCalledOnce();
    expect(captured!.session).toBeNull();
    expect(captured!.error).toBe(false);
  });

  it('refreshSession updates session and clears error on success', async () => {
    authMocks.getSession
      .mockRejectedValueOnce(new Error('first check fails'))
      .mockResolvedValueOnce({ user: { id: 'u-2' } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(captured!.error).toBe(true));

    let refreshed: unknown;
    await act(async () => {
      refreshed = await captured!.refreshSession();
    });
    expect(refreshed).toEqual({ user: { id: 'u-2' } });
    expect(captured!.session).toEqual({ user: { id: 'u-2' } });
    expect(captured!.error).toBe(false);
  });

  it('refreshSession returns null and sets error when refresh fails', async () => {
    authMocks.getSession
      .mockResolvedValueOnce({ user: { id: 'u-1' } })
      .mockRejectedValueOnce(new Error('refresh fails'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(captured!.loading).toBe(false));

    let refreshed: unknown = 'sentinel';
    await act(async () => {
      refreshed = await captured!.refreshSession();
    });
    expect(refreshed).toBeNull();
    expect(captured!.error).toBe(true);
  });
});
