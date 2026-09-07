import { createRoot } from 'react-dom/client';

import { msg } from '../shared/i18n';
import { applyStoredLanguage } from '../shared/language';
import './styles.css';

const start = async (): Promise<void> => {
  const language = await applyStoredLanguage();

  const { default: WelcomeApp } = await import('./WelcomeApp');

  document.title = msg('welcomeTitle');
  document.documentElement.lang =
    language === 'auto' ? chrome.i18n.getUILanguage() : language.replace('_', '-');

  createRoot(document.getElementById('root')!).render(<WelcomeApp />);
};

void start();
