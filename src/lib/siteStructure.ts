import { TV_APP_URL } from "./publicLinks";

export const PUBLIC_SITE_LINKS = [
  {
    name: "Masjid Prayer Times",
    navLabel: "Masjids",
    path: "/masjids",
    description:
      "Find official masjid pages with prayer times, Jumu'ah schedules, announcements, maps, and directions.",
  },
  {
    name: "List Your Masjid",
    navLabel: "List Masjid",
    path: "/list-your-masjid",
    description:
      "Create an official UmmahWay page for a masjid so worshippers can find accurate local information.",
  },
  {
    name: "UmmahWay TV Display",
    navLabel: "TV",
    path: "/tv",
    description:
      "Open the screen-friendly UmmahWay TV display for mosque halls, entrances, and community displays.",
  },
  {
    name: "Sponsor Community Offers",
    navLabel: "Sponsors",
    path: "/sponsor",
    description:
      "Apply to share reviewed sponsor offers with Muslim communities through UmmahWay.",
  },
  {
    name: "Contact UmmahWay",
    navLabel: "Contact",
    path: "/contact",
    description:
      "Contact UmmahWay for support with accounts, purchases, masjid listings, timings, privacy, or technical issues.",
  },
] as const;

export const EXTERNAL_SITE_LINKS = [
  {
    name: "UmmahWay TV",
    href: TV_APP_URL,
  },
] as const;
