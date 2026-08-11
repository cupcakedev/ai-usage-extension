import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyStoredLanguage, watchLanguage } from '../shared/language';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Sidepanel root container not found');
}

/*
 * `App` builds its provider table with `msg()` at import time, so the language
 * override has to be applied before that module is loaded.
 */
const start = async (): Promise<void> => {
  await applyStoredLanguage();

  const { App } = await import('./App');

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  watchLanguage(() => window.location.reload());
};

void start();
