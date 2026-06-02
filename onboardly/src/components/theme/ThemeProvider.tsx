"use client";

// Provides the current theme + a toggle to the app, and keeps the <html> class
// and localStorage in sync. The anti-flash class is set pre-hydration by the
// inline THEME_INIT_SCRIPT in the root layout, so this provider only manages
// changes after mount.

import { createContext, useCallback, useContext, useState } from "react";
import {
  applyTheme,
  resolveInitialTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer runs once on the client. The provider is rendered inside
  // <body>, after the anti-flash script has already set the <html> class, so the
  // resolved value here matches what's painted — no flash, no setState-in-effect.
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme());

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    storeTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next);
      storeTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
