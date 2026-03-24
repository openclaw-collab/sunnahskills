import { useStudio } from "./useStudio";
import { resolveActiveTheme, STUDIO_THEME_PRESETS } from "./studioStore";
import { cn } from "@/lib/utils";

export function ThemeEditor() {
  const { state, setThemePreset, setCustomTheme } = useStudio();
  const { themePresetId, customTheme } = state;
  const activeTheme = resolveActiveTheme(themePresetId, customTheme);

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
              <span
                className="inline-block w-3 h-3 rounded-full border border-white/40"
                style={{ background: p.base.pageBackground }}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50 mb-2">
          Page palette
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorSwatch
            label="Page background"
            value={activeTheme.pageBackground}
            onChange={(v) => setCustomTheme({ pageBackground: v })}
          />
          <ColorSwatch
            label="Main surface"
            value={activeTheme.surfaceMain}
            onChange={(v) => setCustomTheme({ surfaceMain: v })}
          />
          <ColorSwatch
            label="Sub surface"
            value={activeTheme.surfaceSub}
            onChange={(v) => setCustomTheme({ surfaceSub: v })}
          />
          <ColorSwatch
            label="Primary text"
            value={activeTheme.textMain}
            onChange={(v) => setCustomTheme({ textMain: v })}
          />
          <ColorSwatch
            label="Muted text"
            value={activeTheme.textSub}
            onChange={(v) => setCustomTheme({ textSub: v })}
          />
          <ColorSwatch
            label="Accent"
            value={activeTheme.accent}
            onChange={(v) => setCustomTheme({ accent: v })}
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
