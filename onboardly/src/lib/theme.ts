// Theme helpers: read, resolve, apply, and persist the user's light/dark preference.
// The actual class toggling lives here so ThemeProvider/ThemeToggle stay thin.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "onboardly-theme";

/** Read the saved theme from localStorage, or null if none/unavailable. */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

/** The OS-level color-scheme preference (defaults to light). */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Stored preference if present, otherwise the system preference. */
export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** Apply a theme by toggling the `dark` class on <html> (shadcn convention). */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/** Persist the chosen theme so it survives a refresh. */
export function storeTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Inline script run before hydration to set the correct class on <html>,
 * preventing a flash of the wrong theme. Stringified into a <script> tag.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
