"use client";

// Provides the current theme + a toggle to the app, and keeps the <html> class
// and localStorage in sync. The anti-flash class is set pre-hydration by the
// inline THEME_INIT_SCRIPT, injected here via useServerInsertedHTML so it lands
// in the server HTML without rendering a <script> element in the React tree
// (React 19 warns about that). This provider then manages changes after mount.

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import {
  applyTheme,
  resolveInitialTheme,
  storeTheme,
  THEME_INIT_SCRIPT,
  type Theme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Emit the anti-flash script into the server HTML exactly once, before
  // hydration, via useServerInsertedHTML — so the <html> theme class is set
  // before paint without rendering a <script> in the component tree.
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        id="theme-init"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
    );
  });

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
