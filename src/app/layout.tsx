import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./liquid-glass.css";
import GlassProvider from "./GlassProvider";

export const metadata: Metadata = {
  title: "Stream",
  description: "Build better routines, one task at a time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Resolve the theme before first paint so there's no flash of the wrong mode.
const themeScript = `(function(){try{var s=localStorage.getItem('glasskit-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="glass-bg">
        <div className="glass-wash" />
        <div className="glass-texture" />

        <button
          className="theme-toggle glass"
          type="button"
          data-theme-toggle
          aria-label="Toggle dark mode"
        >
          <svg
            className="icon-sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
          </svg>
          <svg
            className="icon-moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.2 6.2 0 0 0 10.5 10.5Z" />
          </svg>
        </button>

        <GlassProvider />
        {children}
      </body>
    </html>
  );
}
