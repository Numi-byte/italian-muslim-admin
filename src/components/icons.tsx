// src/components/icons.tsx
// Lightweight inline SVG icons (stroke-based, inherit currentColor).
import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const MosqueIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M12 3c2.5 2 4 3.6 4 5.5A4 4 0 0 1 8 8.5C8 6.6 9.5 5 12 3Z" />
    <path d="M4 21v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
    <path d="M4 21h16M9 21v-4a3 3 0 0 1 6 0v4" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </svg>
);

export const InboxIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M5 6h14l1 7v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

export const MegaphoneIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5L7 9H5a1 1 0 0 0-1 1Z" />
    <path d="M18 8a5 5 0 0 1 0 8" />
  </svg>
);

export const TagIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M4 12.5 11.5 5H19a1 1 0 0 1 1 1v7.5L12.5 21a1.5 1.5 0 0 1-2.1 0l-6.4-6.4a1.5 1.5 0 0 1 0-2.1Z" />
    <circle cx="15.5" cy="8.5" r="1.3" />
  </svg>
);

export const ChartIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-3M12 16V8M16 16v-5" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

export const LifeBuoyIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="m6.3 6.3 3.4 3.4M14.3 14.3l3.4 3.4M17.7 6.3l-3.4 3.4M9.7 14.3l-3.4 3.4" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
    <path d="M10 12h9M16 8l4 4-4 4" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (p) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
