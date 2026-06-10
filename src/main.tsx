import { render } from 'preact';
import { LanguageProvider } from './i18n';
import App from './App';

const root = document.getElementById('app')!;
render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
  root,
);
