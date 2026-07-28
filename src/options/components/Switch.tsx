interface SwitchProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export const Switch = ({ checked, label, onChange }: SwitchProps) => (
  <label className="auo-switch" aria-label={label}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="auo-switch__track" />
  </label>
);
