import { Check } from 'lucide-react';
import type { SaveState } from '../hooks/useOptionsSettings';

export const OptionsHeader = ({ saveState }: { saveState: SaveState }) => (
  <header className="auo-header">
    <div>
      <p className="auo-eyebrow">Extension preferences</p>
      <h1>AI Usage Tracker</h1>
    </div>
    <p className={`auo-save auo-save--${saveState}`} role="status" aria-live="polite">
      {saveState === 'saved' && <Check size={14} strokeWidth={1.75} aria-hidden="true" />}
      {saveState === 'loading' ? 'Saving…' : saveState === 'error' ? 'Could not save' : 'Saved'}
    </p>
  </header>
);
