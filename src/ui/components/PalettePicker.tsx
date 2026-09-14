import { cn } from "@/lib/utils";
import { PALETTES, setPalettePreference, usePalettePreference } from "../settings/palette";

/**
 * Palette choice, shown under the light/dark picker on Settings → Appearance.
 *
 * Each option previews the palette as a tiny window: its background, a card sitting on it,
 * and a play-button dot in the accent, so the choice is visible before it is made.
 */
export function PalettePicker() {
  const palette = usePalettePreference();

  return (
    <div className="flex flex-col gap-2">
      <h3 id="palette-settings-title" className="text-sm font-medium text-foreground">
        Palette
      </h3>
      <div
        className="grid grid-cols-2 gap-2 md:grid-cols-4"
        role="radiogroup"
        aria-labelledby="palette-settings-title"
      >
        {PALETTES.map((option) => {
          const isActive = palette === option.value;
          const [bg, card, accent] = option.swatch;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setPalettePreference(option.value)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-[background-color,transform] active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive ? "bg-primary/15" : "bg-background/40 hover:bg-card",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-full items-end gap-1.5 overflow-hidden rounded-lg p-1.5 ring-1",
                  isActive ? "ring-primary" : "ring-foreground/10",
                )}
                style={{ background: bg }}
                aria-hidden="true"
              >
                <span className="h-5 flex-1 rounded-md" style={{ background: card }} />
                <span className="size-5 shrink-0 rounded-full" style={{ background: accent }} />
              </span>
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
