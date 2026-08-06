import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { msg } from '../../shared/i18n';
import { APP_ICON } from '../config';
import type { SaveState } from '../hooks/useOptionsSettings';

const SAVE_COPY: Record<SaveState, string> = {
  loading: msg('optionsSaving'),
  saved: msg('optionsSaved'),
  error: msg('optionsSaveError'),
};

export const OptionsHeader = ({ saveState }: { saveState: SaveState }) => {
  return (
    <header className="auo-header">
      <div className="auo-header__identity">
        <img className="auo-applogo" src={APP_ICON} alt="" width={34} height={34} />
        <div>
          <h1>
            {msg('appShortName')}
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
