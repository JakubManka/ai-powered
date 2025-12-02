// ==========================================
// ColorPicker Component - Simple color input with preview
// ==========================================

'use client';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  id?: string;
}

export function ColorPicker({ value, onChange, label, id }: ColorPickerProps) {
  const pickerId = id || `color-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={pickerId}
          className="font-pixel text-xs text-gb-darkest uppercase"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 border-3 border-gb-darkest"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          id={pickerId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-10 border-3 border-gb-darkest cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-28 text-sm"
          pattern="^#[0-9A-Fa-f]{6}$"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

