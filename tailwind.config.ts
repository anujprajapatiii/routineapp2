import type { Config } from "tailwindcss";

// Visual surfaces, colors, and theming are driven by the Liquid Glass kit
// (src/app/liquid-glass.css) via CSS variables. Tailwind is used here only for
// layout utilities (fl, grid, spacing, sizing).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
