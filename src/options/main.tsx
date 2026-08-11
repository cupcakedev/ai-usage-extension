import { createRoot } from 'react-dom/client';
import { msg } from '../shared/i18n';
import { applyStoredLanguage, watchLanguage } from '../shared/language';
import './styles.css';

/*
 * Section titles and metric labels are built with `msg()` at import time, so
 * the language override has to be applied before those modules load, and a
 * language change reloads the page.
 */
const start = async (): Promise<void> => {
  const language = await applyStoredLanguage();

  const { OptionsApp } = await import('./OptionsApp');

  document.title = msg('optionsTitle');
  document.documentElement.lang =
    language === 'auto' ? chrome.i18n.getUILanguage() : language.replace('_', '-');

  createRoot(document.getElementById('root')!).render(<OptionsApp />);

  watchLanguage(() => window.location.reload());
};

void start();
