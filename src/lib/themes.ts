// Five cool ocean color themes. A routine stores its theme key in the `color`
// column. The whole immersive timer is rendered in the theme's gradient, with a
// light and dark variant. Accents drive the list bar, ring, and progress.

export type ThemeKey = "deep" | "lagoon" | "kelp" | "reef" | "tide";

export type OceanTheme = {
  key: ThemeKey;
  name: string;
  blurb: string;
  accent: string; // cool accent for ring / progress / primary action
  gradLight: string; // immersive backdrop, light mode
  gradDark: string; // immersive backdrop, dark mode
};

export const ROUTINE_THEMES: Record<ThemeKey, OceanTheme> = {
  deep: {
    key: "deep",
    name: "Deep",
    blurb: "Midnight trench blue",
    accent: "#2f6f9e",
    gradLight:
      "radial-gradient(125% 100% at 50% 0%, #356f9c 0%, #1f527c 46%, #123a59 100%)",
    gradDark:
      "radial-gradient(125% 100% at 50% 0%, #0c2f4a 0%, #07203a 46%, #030e1d 100%)",
  },
  lagoon: {
    key: "lagoon",
    name: "Lagoon",
    blurb: "Bright shallow aqua",
    accent: "#0bb8d4",
    gradLight:
      "radial-gradient(125% 100% at 50% 0%, #2bb1c8 0%, #168ca6 46%, #0f6a83 100%)",
    gradDark:
      "radial-gradient(125% 100% at 50% 0%, #0a3f4d 0%, #062b38 46%, #04181f 100%)",
  },
  kelp: {
    key: "kelp",
    name: "Kelp",
    blurb: "Cool forest teal",
    accent: "#0f9b86",
    gradLight:
      "radial-gradient(125% 100% at 50% 0%, #2a9b88 0%, #167567 46%, #0e5447 100%)",
    gradDark:
      "radial-gradient(125% 100% at 50% 0%, #0c3a31 0%, #07271f 46%, #03130f 100%)",
  },
  reef: {
    key: "reef",
    name: "Reef",
    blurb: "Clear teal-cyan",
    accent: "#0e8fb0",
    gradLight:
      "radial-gradient(125% 100% at 50% 0%, #2895b1 0%, #16748e 46%, #0e566b 100%)",
    gradDark:
      "radial-gradient(125% 100% at 50% 0%, #0a3344 0%, #06222f 46%, #04131b 100%)",
  },
  tide: {
    key: "tide",
    name: "Tide",
    blurb: "Steel periwinkle",
    accent: "#3f74b0",
    gradLight:
      "radial-gradient(125% 100% at 50% 0%, #4d79ab 0%, #355c89 46%, #213e62 100%)",
    gradDark:
      "radial-gradient(125% 100% at 50% 0%, #15293f 0%, #0d1c2e 46%, #060e19 100%)",
  },
};

export const THEME_LIST: OceanTheme[] = Object.values(ROUTINE_THEMES);
export const DEFAULT_THEME: ThemeKey = "lagoon";

/**
 * Resolve a stored `color` value to a theme. Accepts a theme key, or — for
 * routines created before themes existed — a legacy hex value, which is shown
 * with its hex as the accent over the default ocean gradients.
 */
export function getTheme(color?: string | null): OceanTheme {
  if (color && color in ROUTINE_THEMES) {
    return ROUTINE_THEMES[color as ThemeKey];
  }
  const accent = color && color.startsWith("#") ? color : ROUTINE_THEMES[DEFAULT_THEME].accent;
  return { ...ROUTINE_THEMES[DEFAULT_THEME], accent };
}
