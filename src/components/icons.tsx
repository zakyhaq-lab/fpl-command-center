// 16px outline icons drawn for this app. Stroke follows currentColor.
import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/** The product mark: a pitch seen from above, halfway line and centre circle. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="6" fill="var(--accent)" />
      <rect x="6" y="5" width="16" height="18" rx="1.5" fill="none" stroke="#0b1a1a" strokeWidth="1.6" />
      <line x1="6" y1="14" x2="22" y2="14" stroke="#0b1a1a" strokeWidth="1.6" />
      <circle cx="14" cy="14" r="3" fill="none" stroke="#0b1a1a" strokeWidth="1.6" />
    </svg>
  );
}

export function PitchIcon() {
  return (
    <svg {...base}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M4 12h16" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M9 3v3h6V3M9 21v-3h6v3" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M3 14.5h18M9 4v16M15 4v16" />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <svg {...base}>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h13" />
      <path d="m17 12 4 4-4 4" />
      <path d="M21 16H8" />
    </svg>
  );
}

export function ExitIcon() {
  return (
    <svg {...base}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h10" />
    </svg>
  );
}
