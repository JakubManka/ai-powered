// ==========================================
// Toggle Component - Game Boy styled switch
// ==========================================

'use client';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label
      htmlFor={toggleId}
      className="flex items-center gap-3 cursor-pointer select-none"
    >
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            w-14 h-8 border-3 border-gb-darkest
            transition-colors duration-150
            ${checked ? 'bg-gb-light' : 'bg-gb-lightest'}
          `}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 bg-gb-darkest
              transition-transform duration-150
              ${checked ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </div>
      </div>
      {label && (
        <span className="font-pixel text-xs text-gb-darkest uppercase">
          {label}
        </span>
      )}
    </label>
  );
}

