// Minimal stroke icons used across the app (replacing emoji glyphs).
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChevronUp({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Play({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.78-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function Pause({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function SkipForward({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M5 5v14l9-7-9-7Z" fill="currentColor" stroke="none" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

export function Restart({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M3 12a9 9 0 1 0 2.64-6.36" />
      <path d="M3 4v4h4" />
    </svg>
  );
}

export function Close({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
