import { useSyncExternalStore } from "react";
import { getAppSetting, setAppSetting } from "../../internal/appSettings";

/**
 * Colour palette, independent of light/dark (see theme.ts). The theme decides the mode,
 * the palette decides the colours inside it, so every palette ships a light and dark set
 * and "System" keeps working with all of them.
 *
 * Written to <html data-palette>, which src/ui/styles/palettes.css keys off.
 */
export type PalettePreference = "muses" | "chiron" | "antigravity" | "classic";

export const PALETTES: Array<{ value: PalettePreference; label: string; hint: string; swatch: [string, string, string] }> = [
  { value: "muses", label: "Muses", hint: "Ink and lyre gold", swatch: ["#1b1813", "#2b261e", "#d7b46a"] },
  { value: "chiron", label: "Chiron", hint: "From your study app", swatch: ["var(--swatch-chiron-bg)", "var(--swatch-chiron-card)", "var(--swatch-chiron-accent)"] },
  { value: "antigravity", label: "Antigravity", hint: "From Antigravity", swatch: ["var(--swatch-antigravity-bg)", "var(--swatch-antigravity-card)", "var(--swatch-antigravity-accent)"] },
  { value: "classic", label: "Classic", hint: "The original red", swatch: ["#252525", "#3a3a3a", "#ff0033"] },
];

const STORAGE_KEY = "palette";
const CHANGE_EVENT = "palette-change";
const DEFAULT_PALETTE: PalettePreference = "muses";

function isPalette(value: unknown): value is PalettePreference {
  return PALETTES.some((palette) => palette.value === value);
}

export function readPalettePreference(): PalettePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPalette(stored) ? stored : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

/** Called before React mounts, next to applyTheme, so the first paint has the right colours. */
export function applyPalette(preference = readPalettePreference()): void {
  document.documentElement.setAttribute("data-palette", preference);
}

export function setPalettePreference(preference: PalettePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Durable app settings still get the write below.
  }
  applyPalette(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  void setAppSetting(STORAGE_KEY, preference);
}

export async function hydratePalette(): Promise<void> {
  const stored = await getAppSetting<unknown>(STORAGE_KEY);
  const preference = isPalette(stored) ? stored : readPalettePreference();
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The apply below still reflects the hydrated value.
  }
  applyPalette(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  // `storage` fires in the other window (main <-> mini player) when one of them changes it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    applyPalette();
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePalettePreference(): PalettePreference {
  return useSyncExternalStore(subscribe, readPalettePreference, () => DEFAULT_PALETTE);
}
