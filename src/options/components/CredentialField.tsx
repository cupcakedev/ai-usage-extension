import { useEffect, useState } from 'react';

interface CredentialFieldProps {
  id: string;
  storageKey: string;
  label: string;
  hint?: string;
}

const readStoredKey = async (storageKey: string): Promise<string> => {
  const stored = await chrome.storage.local.get(storageKey);
  const value = stored[storageKey];
  return typeof value === 'string' ? value : '';
};

export const CredentialField = ({ id, storageKey, label, hint }: CredentialFieldProps) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    let active = true;
    void readStoredKey(storageKey).then((stored) => {
      if (active) setValue(stored);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  const persist = (): void => {
    const trimmed = value.trim();
    setValue(trimmed);
    void (trimmed
      ? chrome.storage.local.set({ [storageKey]: trimmed })
      : chrome.storage.local.remove(storageKey));
  };

  return (
    <div className="auo-field auo-credential">
      <label className="auo-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="password"
        className="auo-credential__input"
        autoComplete="off"
        spellCheck={false}
        placeholder={label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={persist}
      />
      {hint && <p className="auo-field__hint">{hint}</p>}
    </div>
  );
};
