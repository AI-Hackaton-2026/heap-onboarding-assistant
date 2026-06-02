# Global Theming Colors Spec

## Overview

Implement a global theming system for the application with consistent light and dark mode color palettes inspired by Symphony’s clean enterprise visual style. The goal is to centralize all colors into reusable theme tokens so every page, component, button, card, border, text, and background uses the same visual language instead of hardcoded colors.

## Requirements

* Create a global theme system that supports both `light` and `dark` mode.
* Define all colors as reusable semantic tokens instead of using raw Tailwind classes or hardcoded hex values directly inside components.
* The visual direction should be minimal, modern, enterprise/SaaS, and inspired by Symphony-style blue tones.
* Light theme should use clean white / cool gray backgrounds with blue accents.
* Dark theme should use deep navy / charcoal backgrounds with blue accents.
* Theming should cover:

  * app background
  * surface/card background
  * elevated surface background
  * primary text
  * secondary/muted text
  * borders
  * primary accent
  * primary accent hover
  * secondary accent
  * success
  * warning
  * error
  * focus ring
  * button backgrounds
  * input backgrounds
  * navigation background
* The theme must be applied globally so the welcome/landing page and all future pages automatically inherit consistent styling.
* Existing components should be updated to use theme variables/classes instead of hardcoded colors.
* Add a theme toggle mechanism or prepare the structure so switching between light and dark mode is simple.
* Store the selected theme in local storage so the user preference persists after refresh.
* Respect system preference as the initial default when no local preference exists.
* Ensure text contrast is readable in both light and dark mode.
* Keep the design subtle and professional; avoid heavy gradients, flashy effects, or overly “AI-generated” visual styling.
* The main CTA color should remain a strong blue accent and should work well in both themes.
* The landing/welcome screen should use the new global theme tokens and should not define its own separate color system.

## Files to Create

* `src/styles/theme.css` — Defines CSS variables for light and dark themes using semantic color tokens.
* `src/lib/theme.ts` — Contains theme helper logic for reading, applying, toggling, and persisting the selected theme.
* `src/components/theme/ThemeProvider.tsx` — Provides theme initialization and applies the correct theme class/attribute to the app root.
* `src/components/theme/ThemeToggle.tsx` — Small reusable theme toggle component for switching between light and dark mode.

## Files to Update

* `src/index.css` or `src/globals.css` — Import global theme styles and ensure base app styles use theme variables.
* `tailwind.config.js` or `tailwind.config.ts` — Extend Tailwind colors to map to CSS variables if Tailwind is used.
* `src/App.tsx` — Wrap the application with the theme provider if needed.
* `src/pages/Welcome.tsx` or the current welcome/landing page file — Replace hardcoded colors with theme tokens.
* Shared UI components such as buttons, cards, inputs, navigation, badges, and links — Update them to use semantic theme classes or CSS variables.

## Suggested Theme Tokens

```css
:root {
  --color-bg: #f7faff;
  --color-bg-soft: #eef6ff;
  --color-surface: #ffffff;
  --color-surface-elevated: #fdfefe;

  --color-text: #07111f;
  --color-text-muted: #5b6b82;
  --color-text-subtle: #8290a3;

  --color-border: #dbe7f5;
  --color-border-strong: #bfd3ea;

  --color-primary: #1277e8;
  --color-primary-hover: #0f67cc;
  --color-primary-soft: #e6f2ff;

  --color-secondary: #38bdf8;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --color-focus: rgba(18, 119, 232, 0.35);

  --color-button-primary-bg: var(--color-primary);
  --color-button-primary-text: #ffffff;

  --color-input-bg: #ffffff;
  --color-nav-bg: rgba(255, 255, 255, 0.82);
}

[data-theme="dark"] {
  --color-bg: #06111f;
  --color-bg-soft: #0b1828;
  --color-surface: #0e1b2d;
  --color-surface-elevated: #13243a;

  --color-text: #f4f8ff;
  --color-text-muted: #a8b6ca;
  --color-text-subtle: #718199;

  --color-border: #213349;
  --color-border-strong: #304966;

  --color-primary: #2693ff;
  --color-primary-hover: #4aa5ff;
  --color-primary-soft: rgba(38, 147, 255, 0.14);

  --color-secondary: #38bdf8;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #f87171;

  --color-focus: rgba(38, 147, 255, 0.42);

  --color-button-primary-bg: var(--color-primary);
  --color-button-primary-text: #ffffff;

  --color-input-bg: #0b1828;
  --color-nav-bg: rgba(6, 17, 31, 0.82);
}
```

## Tailwind Mapping

If Tailwind is used, map semantic colors to CSS variables so components can use readable classes like `bg-background`, `text-foreground`, `bg-surface`, `border-border`, and `text-muted`.

Example:

```ts
colors: {
  background: "var(--color-bg)",
  "background-soft": "var(--color-bg-soft)",
  surface: "var(--color-surface)",
  "surface-elevated": "var(--color-surface-elevated)",
  foreground: "var(--color-text)",
  muted: "var(--color-text-muted)",
  subtle: "var(--color-text-subtle)",
  border: "var(--color-border)",
  "border-strong": "var(--color-border-strong)",
  primary: "var(--color-primary)",
  "primary-hover": "var(--color-primary-hover)",
  "primary-soft": "var(--color-primary-soft)",
  secondary: "var(--color-secondary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)"
}
```

## Key Gotchas

* Do not hardcode colors directly in JSX after this feature is implemented.
* Do not create separate color palettes per page.
* Avoid using too many blue shades manually; use the semantic tokens.
* Make sure dark mode is applied before the first render if possible to avoid theme flashing.
* If using Tailwind dark mode, prefer `darkMode: ["class"]` or a custom `[data-theme="dark"]` approach consistently across the app.
* Keep gradients minimal and subtle. The app should feel professional, not decorative.
* Ensure hover, focus, disabled, and active states are covered for buttons and inputs.
* Make sure the landing page works visually in both themes without layout differences.

## Environment Variables

No new environment variables are required.

## Testing

* Start the app and verify the default theme follows the system preference.
* Switch between light and dark mode and confirm the entire app changes consistently.
* Refresh the page and verify the selected theme is persisted.
* Check the welcome/landing page in both themes.
* Check primary buttons, secondary buttons, cards, inputs, badges, links, and navigation in both themes.
* Verify no obvious hardcoded colors remain in the welcome page or shared UI components.
* Test contrast/readability on both themes.
* Test focus states using keyboard navigation.
* Run the project build and fix any TypeScript or styling issues.

## References

* Use the latest Onboardly landing page mockup direction: minimal SaaS landing page with light and dark theme variants.
* Use Symphony-inspired visual direction: clean enterprise design, cool blue accents, white/cool gray light mode, deep navy/charcoal dark mode.
* The landing page should include: logo, navigation, hero text, short product explanation, `Start Onboarding` CTA, `How it works` secondary action, and subtle onboarding-related preview cards.
