import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0f",
        surface: "#16161d",
        "surface-2": "#1f1f29",
        border: "#2a2a36",
      },
    },
  },
  plugins: [],
};

export default config;
