import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CountrySelector from "../components/CountrySelector";
import { supabase } from "../lib/supabaseClient";
import {
  DEFAULT_COUNTRY_CODE,
  type CountryConfig,
  inferMasjidCountryCode,
} from "../lib/countryConfig";
import { useCountryPreference } from "../lib/countryRouting";
import {
  STORE_LINKS,
  TV_APP_URL,
  getMasjidPath,
  getMasjidTvUrl,
} from "../lib/publicLinks";
import { getCanonicalUrl, getCountryAlternates, setPageSeo } from "../lib/seo";
import { PUBLIC_SITE_LINKS } from "../lib/siteStructure";

type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "clock"
  | "compass"
  | "home"
  | "moon"
  | "pin"
  | "screen"
  | "shield"
  | "star";

type IconProps = {
  name: IconName;
  className?: string;
};

const Icon: React.FC<IconProps> = ({ name, className = "h-5 w-5" }) => {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    bell: (
      <>
        <path d="M15 17H9" />
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
      </>
    ),
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    pin: (
      <>
        <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    screen: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    star: (
      <path d="m12 2 2.7 6.1 6.6.7-4.9 4.5 1.4 6.5L12 16.5l-5.8 3.3 1.4-6.5-4.9-4.5 6.6-.7L12 2Z" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

// Rub el Hizb star lattice — a quiet backdrop on the dark sections.
const StarLattice: React.FC<{ className?: string; id: string }> = ({
  className = "",
  id,
}) => (
  <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id={id} width="88" height="88" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="27" y="27" width="34" height="34" />
          <rect
            x="27"
            y="27"
            width="34"
            height="34"
            transform="rotate(45 44 44)"
          />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

type StoreButtonProps = {
  platform: "ios" | "android";
  className?: string;
};

type ActiveMasjid = {
  id: string;
  slug: string;
  official_name: string;
  short_name: string | null;
  city: string;
  country?: string | null;
  country_code?: string | null;
  region: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

type PlottedMasjid = ActiveMasjid & {
  latitude: number;
  longitude: number;
  coordinateSource: "database" | "address";
};

const pageFeatures = [
  {
    icon: "clock" as const,
    title: "Daily prayer times",
    text: "Today's begins and jama'ah times for all five prayers, ready to check before you set off.",
  },
  {
    icon: "calendar" as const,
    title: "Jumu'ah times",
    text: "Friday khutbah and jama'ah times, with the language and any overflow slots noted alongside.",
  },
  {
    icon: "bell" as const,
    title: "News & notices",
    text: "Events, Ramadan timings and urgent changes from the masjid, in one place instead of scattered messages.",
  },
  {
    icon: "screen" as const,
    title: "Hall display",
    text: "A screen-friendly timetable for entrances and prayer halls, opened straight from the same page.",
  },
];

const adminFeatures = [
  "Masjid profile and visibility",
  "Daily begins and jama'ah times",
  "Jumu'ah slots and khutbah notes",
  "News and notices",
  "Ramadan and iftar timings",
  "Editor access for volunteers",
];

const samplePrayerTimes = [
  ["Fajr", "04:50"],
  ["Dhuhr", "13:30"],
  ["Asr", "18:30"],
  ["Maghrib", "21:10"],
  ["Isha", "23:00"],
];

const coordinateFallbacks: Record<string, { latitude: number; longitude: number }> = {
  "Masjid Via Macello": { latitude: 46.4945383, longitude: 11.3665287 },
  "Masjid Viale Europa": { latitude: 46.4920811, longitude: 11.3225966 },
  "Masjid Via Trento": { latitude: 46.4928884, longitude: 11.3528494 },
  "Masjid Via Torino": { latitude: 46.4911693, longitude: 11.3411239 },
  "Masjid Via Otto Huber": { latitude: 46.6733774, longitude: 11.1574695 },
  "Associazione Pace Rovereto": { latitude: 45.8766139, longitude: 11.0320029 },
};

type LeafletMap = {
  fitBounds: (
    bounds: Array<[number, number]>,
    options?: { padding?: [number, number] }
  ) => void;
  remove: () => void;
};

type LeafletNamespace = {
  map: (
    element: HTMLElement,
    options?: { scrollWheelZoom?: boolean; zoomControl?: boolean }
  ) => LeafletMap;
  tileLayer: (
    urlTemplate: string,
    options?: {
      attribution?: string;
      maxZoom?: number;
    }
  ) => {
    addTo: (map: LeafletMap) => unknown;
  };
  divIcon: (options: {
    className?: string;
    html: string;
    iconAnchor?: [number, number];
    iconSize?: [number, number];
  }) => unknown;
  marker: (
    position: [number, number],
    options?: { icon?: unknown; title?: string }
  ) => {
    addTo: (map: LeafletMap) => {
      bindPopup: (content: string) => unknown;
    };
  };
};

type LeafletWindow = Window & {
  L?: LeafletNamespace;
  ummahWayLeafletPromise?: Promise<LeafletNamespace>;
};

function loadLeaflet(): Promise<LeafletNamespace> {
  const browserWindow = window as LeafletWindow;
  if (browserWindow.L) return Promise.resolve(browserWindow.L);

  if (browserWindow.ummahWayLeafletPromise) {
    return browserWindow.ummahWayLeafletPromise;
  }

  browserWindow.ummahWayLeafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-ummahway-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.ummahwayLeaflet = "true";
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(
      'script[data-ummahway-leaflet="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (browserWindow.L) resolve(browserWindow.L);
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Leaflet failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.defer = true;
    script.dataset.ummahWayLeaflet = "true";
    script.onload = () => {
      if (browserWindow.L) {
        resolve(browserWindow.L);
      } else {
        reject(new Error("Leaflet did not initialize."));
      }
    };
    script.onerror = () => reject(new Error("Leaflet failed to load."));
    document.head.appendChild(script);
  });

  return browserWindow.ummahWayLeafletPromise;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMasjidName(masjid: ActiveMasjid) {
  return masjid.short_name || masjid.official_name;
}

function getAddress(masjid: ActiveMasjid) {
  return [
    masjid.address_line1,
    masjid.address_line2,
    masjid.postal_code,
    masjid.city,
    masjid.region,
  ]
    .filter(Boolean)
    .join(", ");
}

function getDirectionsHref(masjid: ActiveMasjid) {
  if (masjid.latitude != null && masjid.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${masjid.latitude},${masjid.longitude}`;
  }

  const query = getAddress(masjid) || `${masjid.official_name}, ${masjid.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const StoreButton: React.FC<StoreButtonProps> = ({
  platform,
  className = "",
}) => {
  const isIos = platform === "ios";
  const label = isIos ? "Download on the" : "Get it on";
  const store = isIos ? "App Store" : "Google Play";
  const href = isIos ? STORE_LINKS.ios : STORE_LINKS.android;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${store}`}
      className={`inline-flex min-w-[172px] items-center justify-center gap-3 rounded-xl bg-[#0a3d30] px-4 py-3 text-white shadow-lg shadow-[#0a3d30]/20 transition hover:bg-[#0c4a3a] ${className}`}
    >
      {isIos ? (
        <svg
          aria-hidden="true"
          className="h-7 w-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16.42 13.11c-.03-2.71 2.22-4.02 2.32-4.08-1.27-1.86-3.24-2.11-3.93-2.14-1.67-.17-3.26.98-4.1.98-.86 0-2.16-.96-3.56-.93-1.82.03-3.51 1.06-4.45 2.69-1.92 3.32-.49 8.2 1.35 10.88.92 1.32 2 2.79 3.43 2.74 1.38-.06 1.9-.88 3.56-.88 1.65 0 2.14.88 3.58.85 1.5-.03 2.44-1.32 3.33-2.65 1.06-1.51 1.49-2.99 1.51-3.07-.03-.01-2.99-1.15-3.04-4.39ZM13.72 5.12c.75-.94 1.26-2.2 1.12-3.48-1.09.05-2.45.75-3.23 1.66-.7.81-1.33 2.12-1.17 3.35 1.23.09 2.5-.62 3.28-1.53Z" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4.4 3.33c-.24.25-.4.64-.4 1.14v15.06c0 .5.16.89.4 1.14l.05.05 8.44-8.44v-.2L4.45 3.28l-.05.05Z"
            fill="#34A853"
          />
          <path
            d="m15.7 15.1-2.81-2.82v-.2L15.7 9.3l.06.03 3.33 1.9c.95.54.95 1.42 0 1.97l-3.33 1.9-.06.01Z"
            fill="#FBBC04"
          />
          <path
            d="m15.76 15.07-2.87-2.89-8.49 8.49c.39.42 1.04.47 1.77.06l9.59-5.66Z"
            fill="#EA4335"
          />
          <path
            d="M15.76 9.33 6.17 3.67c-.73-.42-1.38-.36-1.77.06l8.49 8.45 2.87-2.85Z"
            fill="#4285F4"
          />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-medium text-white/70">
          {label}
        </span>
        <span className="block text-base font-semibold">{store}</span>
      </span>
    </a>
  );
};

const MasjidPagePreview: React.FC = () => {
  return (
    <div className="rounded-2xl border border-[#e7e1d3] bg-white p-3 shadow-2xl shadow-[#0a3d30]/10">
      <div className="overflow-hidden rounded-xl border border-[#e7e1d3]">
        <div className="relative overflow-hidden bg-[#0a3d30] px-5 py-6 text-center text-white">
          <StarLattice
            id="preview-lattice"
            className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.08]"
          />
          <div className="relative">
            <p className="font-arabic text-base text-[#e6cf9a]">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Masjid Viale Europa
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#e6cf9a]/80">
              Bolzano
            </p>
          </div>
        </div>

        <div className="bg-[#faf8f1] p-4">
          <div className="grid grid-cols-3 gap-2">
            {samplePrayerTimes.slice(0, 3).map(([name, time]) => (
              <div
                key={name}
                className="rounded-lg border border-[#e7e1d3] bg-white p-2.5 text-center"
              >
                <p className="text-[11px] font-medium text-[#9a8c68]">{name}</p>
                <p className="mt-1 font-display text-xl font-semibold text-[#0f5c46]">
                  {time}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[#e7e1d3] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8c68]">
                Jumu'ah
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#1c2b26]">
                13:30
              </p>
              <p className="mt-0.5 text-[11px] text-[#6b7a74]">
                Khutbah in Italian &amp; Arabic
              </p>
            </div>
            <div className="rounded-lg border border-[#e7e1d3] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8c68]">
                Notice
              </p>
              <p className="mt-1 text-[13px] leading-6 text-[#4a5852]">
                Iftar sign-up opens after Maghrib.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type MasjidsDirectoryProps = {
  masjids: ActiveMasjid[];
  plottedMasjids: PlottedMasjid[];
  loading: boolean;
  error: string | null;
  selectedCountry: CountryConfig;
};

const PUBLIC_MASJID_COLUMNS =
  "id, slug, official_name, short_name, city, region, address_line1, address_line2, postal_code, latitude, longitude, timezone";
const PUBLIC_MASJID_COLUMNS_WITH_COUNTRY = `${PUBLIC_MASJID_COLUMNS}, country, country_code`;

const MasjidsDirectory: React.FC<MasjidsDirectoryProps> = ({
  error,
  loading,
  masjids,
  plottedMasjids,
  selectedCountry,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const selectedMasjid = plottedMasjids[0] ?? null;

  useEffect(() => {
    if (!mapRef.current || !plottedMasjids.length) return;

    let cancelled = false;
    let activeMap: LeafletMap | null = null;

    const renderMap = async () => {
      setMapError(null);

      try {
        const leaflet = await loadLeaflet();
        if (cancelled || !mapRef.current) return;

        const map = leaflet.map(mapRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        });
        activeMap = map;

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(map);

        const bounds: Array<[number, number]> = [];

        plottedMasjids.forEach((masjid, index) => {
          bounds.push([masjid.latitude, masjid.longitude]);

          const icon = leaflet.divIcon({
            className: "",
            html: `<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:8px;background:#0f5c46;color:#fff;font-weight:700;font-size:14px;box-shadow:0 10px 22px rgba(10,61,48,.28);border:3px solid #fff;">${
              index + 1
            }</span>`,
            iconAnchor: [17, 17],
            iconSize: [34, 34],
          });

          const address = getAddress(masjid);
          const pageHref = getMasjidPath(masjid.slug);

          leaflet
            .marker([masjid.latitude, masjid.longitude], {
              icon,
              title: masjid.official_name,
            })
            .addTo(map)
            .bindPopup(`
              <div style="max-width: 240px; color: #1c2b26; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <strong style="display:block; font-size:14px; margin-bottom:4px;">${escapeHtml(
                  getMasjidName(masjid)
                )}</strong>
                <span style="display:block; font-size:12px; line-height:1.45; color:#6b7a74;">${escapeHtml(
                  address
                )}</span>
                <a href="${pageHref}" style="display:inline-block; margin-top:10px; padding:7px 10px; border-radius:8px; background:#0f5c46; color:#fff; font-size:12px; font-weight:700; text-decoration:none;">Open page</a>
              </div>
            `);
        });

        map.fitBounds(bounds, { padding: [48, 48] });
      } catch (caughtError) {
        if (!cancelled) {
          setMapError(
            caughtError instanceof Error
              ? caughtError.message
              : "The map failed to load."
          );
        }
      }
    };

    void renderMap();

    return () => {
      cancelled = true;
      activeMap?.remove();
    };
  }, [plottedMasjids]);

  return (
    <section id="directory" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                Directory
              </p>
            </div>
            <h2 className="mt-2 max-w-3xl font-display text-4xl font-semibold leading-tight">
              Find your local masjid in {selectedCountry.name}
            </h2>
          </div>
          <div className="rounded-2xl border border-[#e7e1d3] bg-[#faf8f1] px-5 py-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8c68]">
              Masjids listed
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-[#0f5c46]">
              {loading ? "…" : masjids.length}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="grid gap-3">
            {loading && (
              <p className="rounded-2xl border border-[#e7e1d3] bg-[#faf8f1] p-4 text-sm text-[#6b7a74]">
                Loading masjids…
              </p>
            )}

            {error && (
              <p className="rounded-2xl border border-[#f3d9b4] bg-[#fff8ea] p-4 text-sm text-[#7a5a2a]">
                Could not load masjids: {error}
              </p>
            )}

            {!loading && !error && masjids.length === 0 && (
              <p className="rounded-2xl border border-[#e7e1d3] bg-[#faf8f1] p-4 text-sm text-[#6b7a74]">
                No masjids are listed for {selectedCountry.name} yet. Choose
                another country or ask your masjid to join UmmahWay.
              </p>
            )}

            {!loading &&
              !error &&
              masjids.map((masjid) => {
                const name = getMasjidName(masjid);
                const pagePath = getMasjidPath(masjid.slug);
                return (
                  <article
                    key={masjid.id}
                    className="rounded-2xl border border-[#e7e1d3] bg-[#faf8f1] p-4 transition hover:border-[#0f5c46]/40 hover:bg-[#f4f6f0]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#0f5c46] font-display text-base font-semibold text-[#e6cf9a]">
                          {getInitials(name)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={pagePath}
                            className="block font-display text-xl font-semibold text-[#1c2b26] hover:text-[#0f5c46]"
                          >
                            {name}
                          </Link>
                          <p className="mt-1 text-sm text-[#6b7a74]">
                            {getAddress(masjid) || masjid.city}
                          </p>
                        </div>
                      </div>
                      <span className="w-fit rounded-full bg-[#f2efe4] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7a74]">
                        {masjid.city}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        to={pagePath}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5c46] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#0a3d30]"
                      >
                        Open page
                        <Icon name="arrow" className="h-4 w-4" />
                      </Link>
                      <a
                        href={getDirectionsHref(masjid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        Directions
                      </a>
                      <a
                        href={getMasjidTvUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                      >
                        <Icon name="screen" className="h-4 w-4" />
                        Display
                      </a>
                    </div>
                  </article>
                );
              })}
          </div>

          <div
            id="map"
            className="rounded-2xl border border-[#e7e1d3] bg-white p-3 shadow-xl shadow-[#0a3d30]/10"
          >
            <div className="relative z-0 min-h-[560px] overflow-hidden rounded-xl bg-[#e7ece4] [&_.leaflet-bottom]:z-[10] [&_.leaflet-control-container]:z-[10] [&_.leaflet-pane]:z-[1] [&_.leaflet-popup-pane]:z-[20] [&_.leaflet-top]:z-[10]">
              <div ref={mapRef} className="absolute inset-0" />

              {(loading || mapError || !plottedMasjids.length) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#eef2ea] px-6 text-center">
                  <div className="max-w-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                      Map
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold text-[#1c2b26]">
                      {loading
                        ? "Loading masjids…"
                        : mapError || "No mapped locations yet."}
                    </p>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8c68]">
                      {selectedCountry.name}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-[#1c2b26]">
                      {selectedMasjid
                        ? `${getMasjidName(selectedMasjid)} and ${Math.max(
                            0,
                            plottedMasjids.length - 1
                          )} more on the map`
                        : "Masjid locations"}
                    </p>
                  </div>
                  <p className="font-mono text-[11px] text-[#9a8c68]">
                    OpenStreetMap
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PublicHomePage: React.FC = () => {
  const countryPreference = useCountryPreference();
  const selectedCountry = countryPreference.country;
  const [isScrolled, setIsScrolled] = useState(false);
  const [masjids, setMasjids] = useState<ActiveMasjid[]>([]);
  const [loadingMasjids, setLoadingMasjids] = useState(true);
  const [masjidsError, setMasjidsError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMasjids = async () => {
      setLoadingMasjids(true);
      setMasjidsError(null);

      const countryResult = await supabase
        .from("public_masjids")
        .select(PUBLIC_MASJID_COLUMNS_WITH_COUNTRY)
        .eq("is_active", true)
        .order("city", { ascending: true })
        .order("official_name", { ascending: true });
      let data = countryResult.data as ActiveMasjid[] | null;
      let error = countryResult.error;

      if (error) {
        const fallback = await supabase
          .from("public_masjids")
          .select(PUBLIC_MASJID_COLUMNS)
          .eq("is_active", true)
          .order("city", { ascending: true })
          .order("official_name", { ascending: true });
        data = fallback.data as ActiveMasjid[] | null;
        error = fallback.error;
      }

      if (cancelled) return;

      if (error) {
        setMasjidsError(error.message);
        setMasjids([]);
      } else {
        setMasjids((data ?? []) as ActiveMasjid[]);
      }

      setLoadingMasjids(false);
    };

    void loadMasjids();

    return () => {
      cancelled = true;
    };
  }, []);

  const countryMasjids = useMemo(
    () =>
      masjids.filter((masjid) => {
        const masjidCountryCode = inferMasjidCountryCode(masjid);
        return masjidCountryCode
          ? masjidCountryCode === selectedCountry.code
          : selectedCountry.code === DEFAULT_COUNTRY_CODE;
      }),
    [masjids, selectedCountry.code]
  );

  const plottedMasjids = useMemo(
    () =>
      countryMasjids
        .map((masjid) => {
          if (masjid.latitude != null && masjid.longitude != null) {
            return {
              ...masjid,
              latitude: masjid.latitude,
              longitude: masjid.longitude,
              coordinateSource: "database" as const,
            };
          }

          const fallback = coordinateFallbacks[masjid.official_name];
          if (!fallback) return null;

          return {
            ...masjid,
            latitude: fallback.latitude,
            longitude: fallback.longitude,
            coordinateSource: "address" as const,
          };
        })
        .filter((masjid): masjid is PlottedMasjid => masjid !== null),
    [countryMasjids]
  );

  const featuredMasjids = countryMasjids.slice(0, 3);

  useEffect(() => {
    const path = window.location.pathname === "/" ? "/" : "/masjids";
    const title = `Masjid Prayer Times in ${selectedCountry.name} | UmmahWay`;
    const description = `Find masjids in ${selectedCountry.name}, daily prayer times, Jumu'ah schedules, announcements, directions, and UmmahWay TV display links.`;
    const canonicalUrl = getCanonicalUrl(selectedCountry.code, path);

    setPageSeo({
      title,
      description,
      canonicalUrl,
      alternates: getCountryAlternates(path),
      imageUrl: `${window.location.origin}/icon.png`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "UmmahWay",
          url: canonicalUrl,
          logo: `${window.location.origin}/icon.png`,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "UmmahWay",
          url: canonicalUrl,
          description,
          inLanguage: selectedCountry.language,
          areaServed: selectedCountry.countryIso,
        },
        ...PUBLIC_SITE_LINKS.map((link) => ({
          "@context": "https://schema.org",
          "@type": "SiteNavigationElement",
          name: link.name,
          description: link.description,
          url: `${window.location.origin}${link.path}`,
        })),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Masjids in ${selectedCountry.name}`,
          itemListElement: countryMasjids.slice(0, 50).map((masjid, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: masjid.official_name,
            url: `${window.location.origin}${getMasjidPath(masjid.slug)}`,
          })),
        },
      ],
    });
  }, [countryMasjids, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c2b26] antialiased">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-[#e7e1d3] bg-[#f7f4ec]/95 shadow-sm backdrop-blur"
            : "bg-[#f7f4ec]/75 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="UmmahWay home"
          >
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg shadow-sm" />
            <div>
              <span className="block font-display text-xl font-semibold leading-tight text-[#0a3d30]">
                UmmahWay
              </span>
              <span className="hidden text-[10px] font-medium uppercase text-[#9a8c68] sm:block">
                {selectedCountry.name} masjid prayer times
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#4a5852] md:flex">
            {PUBLIC_SITE_LINKS.map((link) => (
              <Link key={link.path} to={link.path} className="hover:text-[#0f5c46]">
                {link.navLabel}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CountrySelector
              selectedCode={selectedCountry.code}
              className="hidden text-[#4a5852] lg:inline-flex"
            />
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#4a5852] hover:bg-white sm:inline-flex"
            >
              Admin
            </Link>
            <a
              href={TV_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5c46] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a3d30]"
            >
              <Icon name="screen" className="h-4 w-4" />
              Display
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#e7e1d3] bg-[#eef2ea] pt-16">
          <StarLattice
            id="home-hero-lattice"
            className="absolute inset-0 h-full w-full text-[#0a3d30] opacity-[0.05]"
          />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="font-arabic text-2xl text-[#0f5c46]">
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
              </p>

              <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[1.05] text-[#0a3d30] sm:text-6xl lg:text-7xl">
                Prayer times from masjids in {selectedCountry.name}.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4a5852]">
                Every masjid listed for {selectedCountry.name} shows today's prayer times,
                Jumu'ah, news and directions — kept up to date by the people who
                from the people who run it.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#directory"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f5c46]/20 hover:bg-[#0a3d30]"
                >
                  Find a masjid
                  <Icon name="arrow" className="h-4 w-4" />
                </a>
                <a
                  href={TV_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8cfb8] bg-white px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                >
                  <Icon name="screen" className="h-4 w-4" />
                  Open display
                </a>
                <Link
                  to="/contact?topic=masjid_timings"
                  className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-white px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                >
                  List a masjid
                </Link>
              </div>

              {countryPreference.needsChoice && (
                <div className="mt-6 max-w-2xl rounded-2xl border border-[#d8cfb8] bg-white/80 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1c2b26]">
                        Choose your country
                      </p>
                      <p className="mt-1 text-sm text-[#6b7a74]">
                        This domain is not tied to one country yet, so select
                        the country you want to browse.
                      </p>
                    </div>
                    <CountrySelector
                      selectedCode={selectedCountry.code}
                      label="Show"
                      className="text-[#4a5852]"
                    />
                  </div>
                </div>
              )}

              <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3 text-sm">
                {[
                  [
                    loadingMasjids ? "..." : `${countryMasjids.length}`,
                    "masjids listed",
                  ],
                  [
                    loadingMasjids ? "..." : `${plottedMasjids.length}`,
                    "on the map",
                  ],
                  ["5", "daily prayers"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#e7e1d3] bg-white/75 p-3 text-center"
                  >
                    <div className="font-display text-3xl font-semibold text-[#0f5c46]">
                      {value}
                    </div>
                    <div className="mt-1 text-[#6b7a74]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <MasjidPagePreview />

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(featuredMasjids.length ? featuredMasjids : []).map((masjid) => (
                  <Link
                    key={masjid.id}
                    to={getMasjidPath(masjid.slug)}
                    className="rounded-xl border border-[#e7e1d3] bg-white/85 p-3 text-sm font-semibold text-[#1c2b26] shadow-sm hover:border-[#0f5c46]/40"
                  >
                    <span className="block truncate">
                      {getMasjidName(masjid)}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-[#9a8c68]">
                      {masjid.city}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <MasjidsDirectory
          error={masjidsError}
          loading={loadingMasjids}
          masjids={countryMasjids}
          plottedMasjids={plottedMasjids}
          selectedCountry={selectedCountry}
        />

        <section id="pages" className="bg-[#f7f4ec] py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#d8cfb8]" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                    Every page
                  </p>
                </div>
                <h2 className="mt-2 font-display text-4xl font-semibold leading-tight">
                  What's on a masjid page
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[#4a5852]">
                Each page is built around what people look for before heading to
                the masjid: the times, Friday details, notices and how to get
                there.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pageFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-[#e7e1d3] bg-white p-5 transition hover:border-[#0f5c46]/30 hover:shadow-lg hover:shadow-[#0a3d30]/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f5c46] text-[#e6cf9a]">
                    <Icon name={feature.icon} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[#1c2b26]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#6b7a74]">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="teams" className="bg-white py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#d8cfb8]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                  For masjid teams
                </p>
              </div>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-tight">
                One place to keep everything current
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#4a5852]">
                Update the times once and they show on the page, the app and the
                hall display together — no juggling separate tools.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {adminFeatures.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#0f5c46] text-[#e6cf9a]">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium text-[#30403e]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0a3d30] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c4a3a]"
                >
                  Admin sign in
                </Link>
                <Link
                  to="/contact?topic=masjid_timings"
                  className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-white px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                >
                  Get set up
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7e1d3] bg-[#0a3d30] p-4 shadow-2xl shadow-[#0a3d30]/15">
              <div className="rounded-xl bg-[#faf8f1]">
                <div className="flex items-center justify-between border-b border-[#e7e1d3] px-5 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8c68]">
                      Admin console
                    </p>
                    <h3 className="font-display text-xl font-semibold text-[#1c2b26]">
                      Timetable editor
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#f2efe4] px-3 py-1 text-[11px] font-semibold text-[#0f5c46]">
                    Live
                  </span>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {[
                    ["Page", "public site"],
                    ["Display", "hall screen"],
                    ["App", "mobile sync"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl bg-[#f2efe4] p-4">
                      <p className="font-display text-lg font-semibold text-[#0f5c46]">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#6b7a74]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-[#e7e1d3] bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-display text-base font-semibold text-[#1c2b26]">
                        Today's times
                      </h4>
                      <span className="text-xs font-semibold text-[#0f5c46]">
                        Saved
                      </span>
                    </div>
                    <div className="space-y-2">
                      {samplePrayerTimes.map(([name, time]) => (
                        <div
                          key={name}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-[#faf8f1] px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-[#30403e]">
                            {name}
                          </span>
                          <span className="font-display text-base font-semibold text-[#1c2b26]">
                            {time}
                          </span>
                          <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-[#9a8c68]">
                            jama'ah
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0a3d30] py-16 text-white lg:py-20">
          <StarLattice
            id="home-cta-lattice"
            className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.06]"
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <p className="font-arabic text-xl text-[#e6cf9a]">
                حَيَّ عَلَى الصَّلَاة
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
                Prayer times in your pocket
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/75">
                Get the UmmahWay app for prayer times, Jumu'ah and notices from
                the masjids near you.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <StoreButton platform="ios" className="shadow-none" />
              <StoreButton platform="android" className="shadow-none" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e7e1d3] bg-[#f7f4ec]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-display text-lg font-semibold text-[#0a3d30]">
                UmmahWay
              </p>
              <p className="text-sm text-[#6b7a74]">
                Prayer times for local masjids.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-[#4a5852]">
            {PUBLIC_SITE_LINKS.map((link) => (
              <Link key={link.path} to={link.path} className="hover:text-[#0f5c46]">
                {link.navLabel}
              </Link>
            ))}
            <Link to="/privacy" className="hover:text-[#0f5c46]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#0f5c46]">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-[#0f5c46]">
              Contact
            </Link>
            <Link to="/login" className="hover:text-[#0f5c46]">
              Admin
            </Link>
            <span className="text-[#9a8c68]">&copy; {currentYear} UmmahWay</span>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-[#0f5c46]/40 bg-[#0a3d30]/95 px-2 py-2 text-white shadow-2xl shadow-black/30 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 text-center text-[11px] font-medium text-white/70">
          {[
            { href: "/masjids", label: "Masjids", icon: "home" as const },
            { href: "/list-your-masjid", label: "List", icon: "pin" as const },
            { href: "/tv", label: "TV", icon: "screen" as const },
            { href: "/login", label: "Admin", icon: "shield" as const },
          ].map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} to={item.href} className="group py-1">
                <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 group-hover:border-[#e6cf9a] group-hover:text-[#e6cf9a]">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="group py-1"
              >
                <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 group-hover:border-[#e6cf9a] group-hover:text-[#e6cf9a]">
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                {item.label}
              </a>
            )
          )}
        </div>
      </nav>
    </div>
  );
};

export default PublicHomePage;
