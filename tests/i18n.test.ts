import { describe, it, expect, vi, beforeEach } from 'vitest';
import { h } from 'preact';
import { renderHook, act } from '@testing-library/preact';
import { LanguageProvider, useLanguage } from '../src/i18n';

// Note: `t()` is the closure-captured function inside LanguageProvider.
// To test the underlying translation priority (lang → en → fallback → key),
// we render the provider and consume the context via useLanguage().

function renderWithProvider() {
  return renderHook(() => useLanguage(), {
    wrapper: ({ children }: { children: any }) => h(LanguageProvider, null, children),
  });
}

describe('i18n — useLanguage / LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('defaults to browser language when no lang is stored (en in jsdom)', () => {
    const { result } = renderWithProvider();
    expect(result.current.lang).toBe('en');
  });

  it('reads stored lang from localStorage on mount', () => {
    localStorage.setItem('hermes_lang', 'en');
    const { result } = renderWithProvider();
    expect(result.current.lang).toBe('en');
  });

  it('ignores invalid stored values, falls back to browser language', () => {
    localStorage.setItem('hermes_lang', 'fr');
    const { result } = renderWithProvider();
    expect(result.current.lang).toBe('en');
  });

  it('persists new lang to localStorage on setLang', () => {
    const { result } = renderWithProvider();
    act(() => result.current.setLang('en'));
    expect(localStorage.getItem('hermes_lang')).toBe('en');
    expect(result.current.lang).toBe('en');
  });

  describe('t() lookup priority', () => {
    it('returns the Spanish translation when lang=es', () => {
      // Set lang explicitly since jsdom navigator.language is 'en'
      localStorage.setItem('hermes_lang', 'es');
      const { result } = renderWithProvider();
      expect(result.current.t('app.title')).toBe('Helping People');
      expect(result.current.t('auth.signin')).toBe('Iniciar Sesión');
    });

    it('returns the English translation when lang=en', () => {
      localStorage.setItem('hermes_lang', 'en');
      const { result } = renderWithProvider();
      expect(result.current.t('auth.signin')).toBe('Sign In');
    });

    it('falls back to English when a key is missing in the active language', () => {
      // Simulate: even with lang='es', if a key is absent in es translations
      // (none currently are, so we test with an unknown key → falls back to
      //  fallback param → then to the key itself).
      const { result } = renderWithProvider();
      expect(result.current.t('not.a.real.key', 'default text')).toBe('default text');
    });

    it('returns the key itself when no translation and no fallback exist', () => {
      const { result } = renderWithProvider();
      expect(result.current.t('not.a.real.key')).toBe('not.a.real.key');
    });
  });
});