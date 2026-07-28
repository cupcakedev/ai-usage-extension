import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { APP_ICON } from '../config';
import type { SaveState } from '../hooks/useOptionsSettings';

const extensionVersion = (): string | null => {
  try {
    return globalThis.chrome?.runtime?.getManifest?.().version ?? null;
  } catch {
    return null;
  }
};

const SAVE_COPY: Record<SaveState, string> = {
  loading: 'Saving…',
  saved: 'All changes saved',
  error: 'Could not save',
};

export const OptionsHeader = ({ saveState }: { saveState: SaveState }) => {
  const version = extensionVersion();

  return (
    <header className="auo-header">
      <div className="auo-header__identity">
        <img className="auo-applogo" src={APP_ICON} alt="" width={34} height={34} />
        <div>
          <h1>
            AI Usage Tracker
            {version && <span className="auo-version">v{version}</span>}
          </h1>
        </div>
      </div>

      <p className={`auo-save auo-save--${saveState}`} role="status" aria-live="polite">
        {saveState === 'saved' && <Check size={13} strokeWidth={2.2} aria-hidden="true" />}
        {saveState === 'loading' && (
          <RefreshCw className="auo-spin" size={13} strokeWidth={2.2} aria-hidden="true" />
        )}
        {saveState === 'error' && <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" />}
        {SAVE_COPY[saveState]}
      </p>
    </header>
  );
};
