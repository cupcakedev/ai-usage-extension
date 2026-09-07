import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../shared/constants';
import { msg } from '../../shared/i18n';

const readStoredKey = async (): Promise<string> => {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.glmApiKey);
  const value = stored[STORAGE_KEYS.glmApiKey];
  return typeof value === 'string' ? value : '';
};

export const GlmCredentialField = () => {
  const [value, setValue] = useState('');

  useEffect(() => {
    let active = true;
    void readStoredKey().then((stored) => {
      if (active) setValue(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = (): void => {
    const trimmed = value.trim();
    setValue(trimmed);
    void (trimmed
      ? chrome.storage.local.set({ [STORAGE_KEYS.glmApiKey]: trimmed })
      : chrome.storage.local.remove(STORAGE_KEYS.glmApiKey));
  };

  return (
    <div className="auo-field auo-credential">
      <label className="auo-field__label" htmlFor="glm-api-key">
        {msg('optionsGlmKeyLabel')}
      </label>
      <input
        id="glm-api-key"
        type="password"
        className="auo-credential__input"
        autoComplete="off"
        spellCheck={false}
        placeholder={msg('optionsGlmKeyLabel')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={persist}
      />
      <p className="auo-field__hint">{msg('optionsGlmKeyHint')}</p>
    </div>
  );
};
