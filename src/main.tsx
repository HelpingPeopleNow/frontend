import { render } from 'preact';
import { LanguageProvider } from './i18n';
import App from './App';
import './style.css';

const root = document.getElementById('app')!;
render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
  root,
);
