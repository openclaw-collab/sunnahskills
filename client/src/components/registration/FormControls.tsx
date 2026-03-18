import React from "react";

/** Branded radio/checkbox group components for the registration wizard */

type RadioOption = { value: string; label: string; sublabel?: string };

interface RadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RadioGroup({ label, name, options, value, onChange, error }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <div className="font-body text-sm text-charcoal font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2 cursor-pointer rounded-xl border px-4 py-2.5 transition-all duration-150 select-none ${
                selected
                  ? "border-clay bg-clay/8 shadow-[0_0_0_1px_rgba(206,88,51,0.3)]"
                  : "border-charcoal/12 bg-white hover:border-charcoal/25 hover:bg-charcoal/[0.02]"
              }`}
              style={{
                transform: selected ? "scale(1.02)" : "scale(1)",
                transition: "transform 120ms cubic-bezier(0.34,1.56,0.64,1), border-color 120ms ease, background 120ms ease",
              }}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-none transition-all ${
                  selected ? "border-clay" : "border-charcoal/25"
                }`}
              >
                {selected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-clay block" />
                )}
              </span>
              <div>
                <span className={`font-body text-sm ${selected ? "text-charcoal" : "text-charcoal/75"}`}>
                  {opt.label}
                </span>
                {opt.sublabel && (
                  <div className="font-mono-label text-[9px] uppercase tracking-[0.12em] text-charcoal/40 mt-0.5">
                    {opt.sublabel}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="font-body text-xs text-clay mt-1">{error}</p>
      )}
    </div>
  );
}

interface CheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export function CheckboxGroup({ label, options, values, onChange, error }: CheckboxGroupProps) {
  function toggle(val: string) {
    onChange(
      values.includes(val) ? values.filter((v) => v !== val) : [...values, val]
    );
  }
  return (
    <div className="space-y-2">
      <div className="font-body text-sm text-charcoal font-medium">{label}</div>
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-2.5 transition-all duration-150 select-none ${
                checked
                  ? "border-clay bg-clay/8 shadow-[0_0_0_1px_rgba(206,88,51,0.3)]"
                  : "border-charcoal/12 bg-white hover:border-charcoal/25"
              }`}
              style={{
                transform: checked ? "scale(1.01)" : "scale(1)",
                transition: "transform 120ms cubic-bezier(0.34,1.56,0.64,1), border-color 120ms ease",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-none transition-all ${
                  checked ? "border-clay bg-clay" : "border-charcoal/25 bg-white"
                }`}
              >
                {checked && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`font-body text-sm ${checked ? "text-charcoal" : "text-charcoal/75"}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="font-body text-xs text-clay mt-1">{error}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}

export function SelectField({ label, value, onChange, options, placeholder, error, onBlur }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="font-body text-sm text-charcoal font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full rounded-xl border px-4 py-2.5 font-body text-sm text-charcoal bg-white appearance-none focus:outline-none focus:ring-1 transition-colors ${
          error
            ? "border-clay ring-clay/30"
            : "border-charcoal/15 focus:border-charcoal/40 focus:ring-charcoal/20"
        }`}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="font-body text-xs text-clay mt-1">{error}</p>
      )}
    </div>
  );
}
