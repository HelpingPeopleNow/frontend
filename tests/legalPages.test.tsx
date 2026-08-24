import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import CookiesPage from '../src/pages/CookiesPage';
import PrivacyPage from '../src/pages/PrivacyPage';
import TermsPage from '../src/pages/TermsPage';

// Controlled language for the bilingual ternaries
let lang = 'en';

vi.mock('../src/i18n', () => ({
  useLanguage: () => ({ lang, setLang: vi.fn(), t: (key: string) => key }),
}));

// preact-router route — pages wire the logo click to route('/')
vi.mock('preact-router', () => ({
  route: vi.fn(),
}));

describe('legal pages', () => {
  beforeEach(() => {
    lang = 'en';
    document.title = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('CookiesPage renders English content and sets title', () => {
    render(<CookiesPage />);
    expect(screen.getByText('Cookie Policy')).toBeTruthy();
    expect(screen.getByText('1. What Are Cookies?')).toBeTruthy();
    expect(document.title).toBe('Cookie Policy | Helping People');
  });

  it('CookiesPage renders Spanish content and sets title', () => {
    lang = 'es';
    render(<CookiesPage />);
    expect(screen.getByText('Política de Cookies')).toBeTruthy();
    expect(screen.getByText('1. ¿Qué son las cookies?')).toBeTruthy();
    expect(document.title).toBe('Política de Cookies | Helping People');
  });

  it('PrivacyPage renders English content with contact email', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getAllByText('goodbytes23@gmail.com').length).toBeGreaterThan(0);
    expect(document.title).toBe('Privacy Policy | Helping People');
  });

  it('PrivacyPage renders Spanish content', () => {
    lang = 'es';
    render(<PrivacyPage />);
    expect(screen.getByText('Política de Privacidad')).toBeTruthy();
    expect(screen.getByText('1. Responsable del Tratamiento')).toBeTruthy();
    expect(document.title).toBe('Política de Privacidad | Helping People');
  });

  it('TermsPage renders English content', () => {
    render(<TermsPage />);
    expect(screen.getByText('Terms & Conditions')).toBeTruthy();
    expect(screen.getByText('1. Acceptance of Terms')).toBeTruthy();
    expect(document.title).toBe('Terms & Conditions | Helping People');
  });

  it('TermsPage renders Spanish content', () => {
    lang = 'es';
    render(<TermsPage />);
    expect(screen.getByText('Términos y Condiciones')).toBeTruthy();
    expect(screen.getByText('1. Aceptación de los Términos')).toBeTruthy();
    expect(document.title).toBe('Términos y Condiciones | Helping People');
  });
});
