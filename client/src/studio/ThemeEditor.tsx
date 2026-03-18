import { useStudio } from "./useStudio";
import { STUDIO_THEME_PRESETS } from "./studioStore";
import { cn } from "@/lib/utils";

export function ThemeEditor() {
  const { state, setThemePreset, setCustomTheme } = useStudio();
  const { themePresetId, customTheme } = state;

  return (
    <div className="space-y-4">
      {/* Preset chips */}
      <div>
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">Presets</div>
        <div className="flex flex-wrap gap-2">
          {STUDIO_THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setThemePreset(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-mono-label uppercase tracking-[0.14em] border transition-all",
                themePresetId === p.id
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-white text-charcoal/70 border-charcoal/15 hover:border-charcoal/30",
              )}
            >
              {/* Color swatch */}
              <span
                className="inline-block w-3 h-3 rounded-full border border-white/40"
                style={{ background: p.base.background }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom 3-slot color pickers */}
      <div>
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
          Custom colours
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ColorSwatch
            label="Background"
            value={customTheme.background}
            onChange={(v) => setCustomTheme({ background: v })}
          />
          <ColorSwatch
            label="Components"
            value={customTheme.subtheme1}
            onChange={(v) => setCustomTheme({ subtheme1: v })}
          />
          <ColorSwatch
            label="Highlight"
            value={customTheme.highlight}
            onChange={(v) => setCustomTheme({ highlight: v })}
          />
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col items-center gap-1 cursor-pointer group">
      <span
        className="w-10 h-10 rounded-2xl border-2 border-charcoal/10 group-hover:border-charcoal/30 transition-colors overflow-hidden relative"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title={label}
        />
      </span>
      <span className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50 text-center leading-tight">
        {label}
      </span>
    </label>
  );
}
