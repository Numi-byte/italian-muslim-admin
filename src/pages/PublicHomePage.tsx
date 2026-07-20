import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type IconName =
  | "bell"
  | "calendar"
  | "check"
  | "clock"
  | "globe"
  | "map"
  | "megaphone"
  | "shield"
  | "spark";

type IconProps = {
  name: IconName;
  className?: string;
};

const Icon: React.FC<IconProps> = ({ name, className = "h-5 w-5" }) => {
  const paths: Record<IconName, React.ReactNode> = {
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
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a13 13 0 0 1 0 18" />
        <path d="M12 3a13 13 0 0 0 0 18" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </>
    ),
    megaphone: (
      <>
        <path d="m3 11 18-5v12L3 13v-2Z" />
        <path d="M11 15v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2v6" />
        <path d="M12 16v6" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="M2 12h6" />
        <path d="M16 12h6" />
        <path d="m4.93 19.07 4.24-4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
      </>
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
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const features = [
  {
    icon: "clock" as const,
    title: "Official prayer times",
    text: "Start and jama'ah times are managed by each masjid, so the schedule people see is the one the masjid actually follows.",
  },
  {
    icon: "calendar" as const,
    title: "Friday made clear",
    text: "Jumu'ah slots, khutbah languages, overflow times, and special notes stay in one calm place.",
  },
  {
    icon: "megaphone" as const,
    title: "Community notices",
    text: "Admins can publish essential updates without turning the app into another noisy group chat.",
  },
  {
    icon: "globe" as const,
    title: "Built for local languages",
    text: "Italian, German, English, Arabic, and Urdu support help families across South Tyrol and Trentino feel included.",
  },
];

const prayerTimes = [
  ["Fajr", "06:08"],
  ["Dhuhr", "12:31"],
  ["Asr", "15:47"],
  ["Maghrib", "17:34"],
  ["Isha", "19:06"],
];

const storeLinks = {
  ios: "https://apps.apple.com/app/ummahway/id6757399317",
  android: "https://play.google.com/store/apps/details?id=com.ummahway.app",
};

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
  address_line1: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PlottedMasjid = ActiveMasjid & {
  latitude: number;
  longitude: number;
  coordinateSource: "database" | "address";
};

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
    script.dataset.ummahwayLeaflet = "true";
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

const StoreButton: React.FC<StoreButtonProps> = ({
  platform,
  className = "",
}) => {
  const isIos = platform === "ios";
  const label = isIos ? "Download on the" : "Get it on";
  const store = isIos ? "App Store" : "Google Play";
  const href = isIos ? storeLinks.ios : storeLinks.android;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${store}`}
      className={`inline-flex min-w-[172px] items-center justify-center gap-3 rounded-[8px] bg-[#14201f] px-4 py-3 text-white shadow-lg shadow-[#0d302b]/15 transition hover:bg-[#263331] ${className}`}
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
          <path d="M4.4 3.33c-.24.25-.4.64-.4 1.14v15.06c0 .5.16.89.4 1.14l.05.05 8.44-8.44v-.2L4.45 3.28l-.05.05Z" fill="#34A853" />
          <path d="m15.7 15.1-2.81-2.82v-.2L15.7 9.3l.06.03 3.33 1.9c.95.54.95 1.42 0 1.97l-3.33 1.9-.06.01Z" fill="#FBBC04" />
          <path d="m15.76 15.07-2.87-2.89-8.49 8.49c.39.42 1.04.47 1.77.06l9.59-5.66Z" fill="#EA4335" />
          <path d="M15.76 9.33 6.17 3.67c-.73-.42-1.38-.36-1.77.06l8.49 8.45 2.87-2.85Z" fill="#4285F4" />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold text-white/70">
          {label}
        </span>
        <span className="block text-base font-black">{store}</span>
      </span>
    </a>
  );
};

const AppPrayerPreview: React.FC = () => {
  const timeline = [
    ["04:50", "Fajr"],
    ["13:30", "Dhuhr"],
    ["18:30", "Asr"],
    ["21:10", "Maghrib"],
    ["23:00", "Isha"],
  ];

  return (
    <div className="relative mx-auto w-full max-w-[390px] sm:max-w-[430px]">
      <div className="rounded-[34px] border border-white/10 bg-[#050817] p-2 shadow-2xl shadow-[#020617]/40 sm:rounded-[42px] sm:p-3">
        <div className="overflow-hidden rounded-[28px] bg-[#070b1d] text-white sm:rounded-[34px]">
          <div className="flex items-center justify-between px-5 pb-4 pt-5 text-xs font-black text-white sm:px-7">
            <span>14:10</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="h-3 w-5 rounded-sm border border-white/60">
                <span className="block h-full w-3/5 bg-white/80" />
              </span>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-[#050817]">
                59
              </span>
            </div>
          </div>

          <div className="relative mx-3 rounded-b-[26px] bg-[#0b162d] px-4 pb-7 pt-5 sm:mx-4 sm:px-5">
            <div className="absolute bottom-14 left-6 right-4 h-24 rounded-t-full border-t-4 border-[#243553]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <h2 className="text-5xl font-black leading-none tracking-normal sm:text-6xl">
                  Dhuhr
                </h2>
                <p className="mt-4 text-xl font-medium text-white/70 sm:text-2xl">
                  4 h 19 min until Asr
                </p>
                <p className="mt-2 text-xl font-black text-[#80d9aa] sm:text-2xl">
                  Asr (18:30)
                </p>
              </div>
              <div className="rounded-full border border-white/20 bg-[#060a1a]/90 px-4 py-3 shadow-lg">
                <p className="max-w-[122px] text-sm font-black leading-tight sm:text-base">
                  Masjid Viale Europa
                </p>
              </div>
            </div>

            <div className="relative mt-16 h-28">
              <div className="absolute left-1 right-3 top-10 h-1 origin-left rotate-[-10deg] rounded-full bg-[#8ad7b6]" />
              <div className="absolute left-[46%] right-4 top-12 h-1 origin-left rotate-[11deg] rounded-full bg-[#95a8c7]" />
              <div className="absolute left-[43%] top-[-34px] h-28 w-3 rounded-full bg-[#8a6443]" />
              <div className="absolute left-[40%] top-7 h-12 w-12 rounded-full bg-[#f7bd50] ring-8 ring-[#2e3a51]" />
              <div className="absolute right-0 top-0 h-24 w-36 rounded-t-full bg-[#9a7148]/90 shadow-inner">
                <div className="absolute bottom-0 left-0 right-0 h-16 rounded-t-[32px] bg-[#7b5739]" />
                <div className="absolute bottom-0 left-6 h-12 w-7 rounded-t-full bg-[#0b162d]" />
                <div className="absolute bottom-0 left-[72px] h-12 w-7 rounded-t-full bg-[#0b162d]" />
                <div className="absolute bottom-0 right-6 h-12 w-7 rounded-t-full bg-[#0b162d]" />
              </div>
              {["8%", "30%", "50%", "72%", "94%"].map((left, index) => (
                <span
                  key={left}
                  className={`absolute top-[54px] h-7 w-7 -translate-x-1/2 rounded-full border-4 ${
                    index === 1
                      ? "border-[#89d7b2] bg-[#17283a]"
                      : "border-[#aeb9ce] bg-[#0b162d]"
                  }`}
                  style={{ left }}
                />
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              {timeline.map(([time, name]) => (
                <div key={name}>
                  <p
                    className={`text-base font-black ${
                      name === "Dhuhr" ? "text-white" : "text-white/65"
                    }`}
                  >
                    {time}
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      name === "Dhuhr" ? "text-[#80d9aa]" : "text-white/55"
                    }`}
                  >
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 px-3 py-4 sm:px-4">
            <div className="rounded-[24px] bg-[#050a19] p-4 ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-3xl text-white/70">
                  ‹
                </button>
                <div className="text-center">
                  <p className="text-2xl font-black">Today, 06 Jun</p>
                  <p className="mt-1 text-base font-black text-[#ffb47d]">
                    20 Dhu'l-Hijjah 1447 AH
                  </p>
                </div>
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-3xl text-white/70">
                  ›
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 rounded-[18px] border border-white/10 bg-[#0c1224] p-1">
                <span className="py-3 text-center text-base font-black text-white/55">
                  Shafi
                </span>
                <span className="rounded-[14px] border border-[#3fa56f] bg-[#104a3d] py-3 text-center text-base font-black text-white">
                  Hanafi
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#5d35a7] bg-[#080b22] p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#704b81] bg-[#3f2d3d] text-[#ffc15f]">
                  <Icon name="calendar" className="h-8 w-8" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black">Jumu'ah (Friday)</p>
                  <p className="mt-1 text-sm leading-5 text-white/60">
                    Friday schedule appears when you switch to Friday.
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full rounded-[14px] bg-[#7650df] px-4 py-3 text-base font-black text-white">
                View Friday Info
              </button>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#0b1224] p-4">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xl font-black">Prayer Times</p>
                <span className="text-sm font-black text-white/50">View All</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#1f2631] text-[#f7c052]">
                  <Icon name="clock" className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-white/75">Fajr</p>
                  <p className="text-sm font-bold text-white/45">
                    Adhan 02:42 · Jama'ah 04:50
                  </p>
                </div>
                <p className="text-4xl font-light text-white/55">04:50</p>
              </div>
            </div>
          </div>

          <div className="mx-3 mb-3 rounded-[30px] border border-[#254c46] bg-[#111827]/90 px-3 py-3">
            <div className="grid grid-cols-4 text-center text-[11px] font-black text-white/45">
              {["Home", "Prayers", "Announce...", "Settings"].map((item) => (
                <div
                  key={item}
                  className={item === "Prayers" ? "text-white" : undefined}
                >
                  <span
                    className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border ${
                      item === "Prayers"
                        ? "border-[#5fe38f] bg-[#244f3d] text-[#76e99a]"
                        : "border-white/10"
                    }`}
                  >
                    {item === "Prayers" ? "L" : ""}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveMasjidsMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [masjids, setMasjids] = useState<PlottedMasjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMasjids = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("masjids")
        .select(
          "id, slug, official_name, short_name, city, address_line1, postal_code, latitude, longitude"
        )
        .eq("is_active", true)
        .order("city", { ascending: true })
        .order("official_name", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setMasjids([]);
      } else {
        const plotted = ((data ?? []) as ActiveMasjid[])
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
          .filter((masjid): masjid is PlottedMasjid => masjid !== null);

        setMasjids(plotted);
      }

      setLoading(false);
    };

    void loadMasjids();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMasjid = masjids[0] ?? null;

  useEffect(() => {
    if (!mapRef.current || !masjids.length) return;

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

        masjids.forEach((masjid, index) => {
          const position = {
            lat: masjid.latitude,
            lng: masjid.longitude,
          };
          bounds.push([position.lat, position.lng]);

          const icon = leaflet.divIcon({
            className: "",
            html: `<span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:999px;background:#0b6b62;color:#fff;font-weight:900;font-size:14px;box-shadow:0 10px 22px rgba(13,48,43,.28);border:4px solid #fff;">${
              index + 1
            }</span>`,
            iconAnchor: [17, 17],
            iconSize: [34, 34],
          });

          const address = [
            masjid.address_line1,
            masjid.postal_code,
            masjid.city,
          ]
            .filter(Boolean)
            .join(", ");

          leaflet
            .marker([position.lat, position.lng], {
              icon,
              title: masjid.official_name,
            })
            .addTo(map)
            .bindPopup(`
              <div style="max-width: 240px; color: #14201f; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <strong style="display:block; font-size:14px; margin-bottom:4px;">${escapeHtml(
                  masjid.short_name || masjid.official_name
                )}</strong>
                <span style="display:block; font-size:12px; line-height:1.45; color:#52615f;">${escapeHtml(
                  address
                )}</span>
                <span style="display:block; margin-top:8px; font-size:11px; color:#0b6b62; font-weight:700;">${masjid.latitude.toFixed(
                  6
                )}, ${masjid.longitude.toFixed(6)}</span>
                <span style="display:block; margin-top:4px; font-size:11px; color:#697875;">${
                  masjid.coordinateSource === "database"
                    ? "Saved database coordinates"
                    : "Verified from active address"
                }</span>
                <a href="/masjids/${encodeURIComponent(
                  masjid.slug
                )}" style="display:inline-block; margin-top:10px; padding:7px 10px; border-radius:999px; background:#0b6b62; color:#fff; font-size:12px; font-weight:800; text-decoration:none;">View masjid page</a>
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
  }, [masjids]);

  return (
    <section id="map" className="bg-[#f6f7f4] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#0b6b62]">
              Active masjid map
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#14201f] sm:text-4xl">
              Trentino-Alto Adige masjids, placed from exact coordinates.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#52615f]">
              This map reads the current active masjids from Supabase and plots
              saved latitude and longitude values, with verified address
              coordinates used for active rows that have empty coordinate fields.
            </p>

            <div className="mt-8 rounded-[8px] border border-[#dfe5df] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#697875]">
                    Showing
                  </p>
                  <p className="mt-1 text-3xl font-black text-[#0b6b62]">
                    {loading ? "..." : masjids.length}
                  </p>
                </div>
                <span className="rounded-full bg-[#dcf5eb] px-3 py-1 text-xs font-black text-[#0b6b62]">
                  Active only
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {loading && (
                  <p className="text-sm font-semibold text-[#697875]">
                    Loading active masjids...
                  </p>
                )}

                {error && (
                  <p className="rounded-[8px] bg-[#fff4df] p-3 text-sm font-semibold text-[#7a5a2a]">
                    Could not load masjids: {error}
                  </p>
                )}

                {!loading && !error && masjids.length === 0 && (
                  <p className="text-sm font-semibold text-[#697875]">
                    No active masjids with coordinates are available yet.
                  </p>
                )}

                {!loading &&
                  !error &&
                  masjids.map((masjid) => (
                    <div
                      key={masjid.id}
                      className="block rounded-[8px] border border-[#e4e9e5] bg-[#fbfcfa] p-3 transition hover:border-[#0b6b62]/40 hover:bg-[#f6fbf8]"
                    >
                      <Link
                        to={`/masjids/${encodeURIComponent(masjid.slug)}`}
                        className="block text-sm font-black text-[#14201f] hover:text-[#0b6b62]"
                      >
                        {masjid.short_name || masjid.official_name}
                      </Link>
                      <span className="mt-1 block text-xs font-semibold text-[#697875]">
                        {[masjid.address_line1, masjid.postal_code, masjid.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <span className="mt-2 block font-mono text-[11px] text-[#0b6b62]">
                        {masjid.latitude.toFixed(6)},{" "}
                        {masjid.longitude.toFixed(6)}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold text-[#697875]">
                        {masjid.coordinateSource === "database"
                          ? "Saved database coordinates"
                          : "Verified from active address"}
                      </span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to={`/masjids/${encodeURIComponent(masjid.slug)}`}
                          className="rounded-full bg-[#0b6b62] px-3 py-1.5 text-[11px] font-black text-white"
                        >
                          Masjid page
                        </Link>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${masjid.latitude},${masjid.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[#dfe5df] px-3 py-1.5 text-[11px] font-black text-[#425351]"
                        >
                          Directions
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-[#d1dbd5] bg-white p-3 shadow-2xl shadow-[#0d302b]/10">
            <div className="relative z-0 min-h-[560px] overflow-hidden rounded-[8px] bg-[#dfe8e2] [&_.leaflet-bottom]:z-[10] [&_.leaflet-control-container]:z-[10] [&_.leaflet-pane]:z-[1] [&_.leaflet-popup-pane]:z-[20] [&_.leaflet-top]:z-[10]">
              <div ref={mapRef} className="absolute inset-0" />

              {(loading || mapError || !masjids.length) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#edf2ee] px-6 text-center">
                  <div className="max-w-sm">
                    <p className="text-sm font-black uppercase tracking-wide text-[#0b6b62]">
                      Interactive map
                    </p>
                    <p className="mt-2 text-lg font-black text-[#14201f]">
                      {loading
                        ? "Loading active masjids..."
                        : mapError || "No active masjids to show yet."}
                    </p>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-[8px] border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#697875]">
                      OpenStreetMap
                    </p>
                    <p className="mt-1 text-sm font-black text-[#14201f]">
                      {selectedMasjid
                        ? `${selectedMasjid.official_name} and ${Math.max(
                            0,
                            masjids.length - 1
                          )} more active masjids`
                        : "Active masjid locations"}
                    </p>
                  </div>
                  <p className="font-mono text-[11px] text-[#697875]">
                    Trentino-Alto Adige/Sudtirol
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
  const [isScrolled, setIsScrolled] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className="min-h-screen bg-[#050817] text-white antialiased sm:bg-[#f6f7f4] sm:text-[#14201f]">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-white/10 bg-[#050817]/92 shadow-sm backdrop-blur sm:border-[#d8ddd4] sm:bg-[#f6f7f4]/95"
            : "bg-[#050817]/70 backdrop-blur sm:bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="UmmahWay home">
            <img
              src="/icon.png"
              alt=""
              className="h-10 w-10 rounded-[8px] shadow-sm"
            />
            <div>
              <span className="block text-base font-bold leading-tight text-white sm:text-[#123835]">
                UmmahWay
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-wide text-white/45 sm:block sm:text-[#697875]">
                Local masjid companion
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#425351] md:flex">
            <a href="#features" className="hover:text-[#006f66]">
              Features
            </a>
            <a href="#map" className="hover:text-[#006f66]">
              Map
            </a>
            <a href="#masjids" className="hover:text-[#006f66]">
              For masjids
            </a>
            <a href="#community" className="hover:text-[#006f66]">
              Community
            </a>
            <Link to="/sponsor" className="hover:text-[#006f66]">
              Sponsors
            </Link>
            <Link to="/contact" className="hover:text-[#006f66]">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#425351] hover:bg-white sm:inline-flex"
            >
              Admin login
            </Link>
            <a
              href="#download"
              className="inline-flex items-center rounded-full bg-[#71e49b] px-4 py-2 text-sm font-bold text-[#04100d] shadow-sm shadow-[#0b6b62]/20 hover:bg-[#8cf3ae] sm:bg-[#0b6b62] sm:text-white sm:hover:bg-[#095a53]"
            >
              Download app
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-[#050817] sm:bg-[#eef2ec]" />
          <div className="absolute inset-0 hidden opacity-40 [background-image:linear-gradient(#dce5df_1px,transparent_1px),linear-gradient(90deg,#dce5df_1px,transparent_1px)] [background-size:72px_72px] sm:block" />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_30%_10%,rgba(87,227,143,0.18),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(118,80,223,0.18),transparent_30%)] sm:hidden" />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 pb-14 sm:gap-10 sm:px-6 sm:pb-16 lg:grid-cols-[1fr_0.86fr] lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-[#8de6b2] shadow-sm sm:mb-7 sm:border-[#cad8d3] sm:bg-white/70 sm:text-[#24514d]">
                <Icon name="map" className="h-4 w-4 text-[#0b6b62]" />
                South Tyrol and Trentino
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-normal text-white sm:text-6xl sm:text-[#102421] lg:text-7xl">
                UmmahWay keeps every masjid update close to home.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:mt-6 sm:text-xl sm:leading-8 sm:text-[#425351]">
                Verified prayer times, Jumu'ah schedules, Ramadan updates, and
                community announcements from the masjids people already trust.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:mt-9 sm:flex sm:flex-row">
                <StoreButton platform="ios" className="min-w-0" />
                <StoreButton platform="android" className="min-w-0" />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact?topic=masjid_timings"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#71e49b] px-6 py-3 text-sm font-bold text-[#04100d] shadow-lg shadow-[#0b6b62]/20 hover:bg-[#8cf3ae] sm:bg-[#0b6b62] sm:text-white sm:hover:bg-[#095a53]"
                >
                  Bring your masjid online
                  <Icon name="spark" className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 shadow-sm hover:bg-white/10 sm:border-[#c8d0c8] sm:bg-white/70 sm:text-[#1f3431] sm:hover:bg-white"
                >
                  Explore features
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 text-xs sm:mt-10 sm:gap-3 sm:text-sm">
                {[
                  ["12+", "masjids ready"],
                  ["5", "languages"],
                  ["0", "public chat noise"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[16px] border border-white/10 bg-white/5 p-3 sm:rounded-none sm:border-l sm:border-r-0 sm:border-y-0 sm:border-[#cfd8d2] sm:bg-transparent sm:py-2 sm:pl-4"
                  >
                    <div className="text-2xl font-black text-[#71e49b] sm:text-[#0b6b62]">
                      {value}
                    </div>
                    <div className="mt-1 text-white/50 sm:text-[#62706e]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[430px]">
              <div className="absolute -left-10 top-14 hidden w-52 rounded-[8px] border border-white/80 bg-white/85 p-4 shadow-xl shadow-[#0d302b]/10 backdrop-blur md:block">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0c46c]/30 text-[#a46216]">
                    <Icon name="bell" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#14201f]">
                      Announcement
                    </p>
                    <p className="text-xs text-[#687774]">Iftar booking opens tonight</p>
                  </div>
                </div>
              </div>

              <AppPrayerPreview />

              <div className="absolute -bottom-6 right-0 hidden w-52 rounded-[8px] border border-white/10 bg-[#0b1224]/95 p-4 shadow-xl shadow-[#020617]/20 backdrop-blur sm:block">
                <p className="text-xs font-bold uppercase tracking-wide text-[#697875]">
                  Admin synced
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  Times updated 4 min ago
                </p>
              </div>
            </div>
          </div>
        </section>

        <ActiveMasjidsMap />

        <section id="features" className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#b56b1c]">
                  The essentials
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#14201f] sm:text-4xl">
                  One trusted channel between the masjid and the community.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[#52615f]">
                UmmahWay is designed for daily use: fast to scan, respectful of
                attention, and simple enough for volunteers to keep accurate.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-[8px] border border-[#dfe5df] bg-[#fbfcfa] p-5 transition hover:-translate-y-1 hover:border-[#aebdb8] hover:shadow-lg hover:shadow-[#0d302b]/5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#e5f1ee] text-[#0b6b62]">
                    <Icon name={feature.icon} />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-[#14201f]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#5f6e6b]">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="masjids" className="bg-[#edf2ee] py-20 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#0b6b62]">
                For masjid teams
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#14201f] sm:text-4xl">
                A calm admin console for the work behind every prayer time.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52615f]">
                Volunteers can manage masjid profiles, daily timings, Friday
                schedules, Ramadan settings, announcements, and sponsorship
                requests from a secure dashboard.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Role based admin access",
                  "Daily start and jama'ah times",
                  "Jumu'ah slots and languages",
                  "Ramadan and iftar tools",
                  "Announcement publishing",
                  "Usage insights",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#0b6b62] text-white">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-bold text-[#30403e]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-[#14201f] px-6 py-3 text-sm font-bold text-white hover:bg-[#263331]"
                >
                  Open admin console
                </Link>
                <Link
                  to="/contact?topic=masjid_timings"
                  className="inline-flex items-center justify-center rounded-full border border-[#b8c4bf] bg-white/70 px-6 py-3 text-sm font-bold text-[#1f3431] hover:bg-white"
                >
                  Request onboarding
                </Link>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#d1dbd5] bg-[#14201f] p-4 shadow-2xl shadow-[#0d302b]/15">
              <div className="rounded-[8px] bg-[#f8faf7]">
                <div className="flex items-center justify-between border-b border-[#dde5df] px-5 py-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#697875]">
                      UmmahWay admin
                    </p>
                    <h3 className="text-lg font-black text-[#14201f]">
                      Masjid al-Huda
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#dcf5eb] px-3 py-1 text-xs font-black text-[#0b6b62]">
                    Live
                  </span>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {[
                    ["234", "visits today"],
                    ["5", "prayer sets"],
                    ["3", "active posts"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[8px] bg-[#edf2ee] p-4">
                      <p className="text-2xl font-black text-[#0b6b62]">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#697875]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <div className="rounded-[8px] border border-[#dfe5df] bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-black text-[#14201f]">
                        Today's timing sheet
                      </h4>
                      <span className="text-xs font-bold text-[#0b6b62]">
                        Saved
                      </span>
                    </div>
                    <div className="space-y-2">
                      {prayerTimes.map(([name, time]) => (
                        <div
                          key={name}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[8px] bg-[#f6f7f4] px-3 py-2 text-sm"
                        >
                          <span className="font-bold text-[#30403e]">
                            {name}
                          </span>
                          <span className="font-black text-[#14201f]">
                            {time}
                          </span>
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#697875]">
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

        <section id="community" className="bg-[#102421] py-20 text-white lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#f0c46c]">
                  Community first
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                  Built for worshippers, families, students, and volunteers.
                </h2>
                <p className="mt-5 text-lg leading-8 text-white/70">
                  The page people open on the way to prayer should be quick,
                  readable, and dependable. UmmahWay keeps the experience
                  focused on what people came for.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: "shield" as const,
                    title: "Respectful",
                    text: "No public comment threads or social feed pressure.",
                  },
                  {
                    icon: "bell" as const,
                    title: "Timely",
                    text: "Important changes can reach the community quickly.",
                  },
                  {
                    icon: "map" as const,
                    title: "Local",
                    text: "Designed around real masjids in nearby cities.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[8px] border border-white/10 bg-white/8 p-5"
                  >
                    <Icon name={item.icon} className="h-6 w-6 text-[#f0c46c]" />
                    <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="download" className="bg-white py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#b56b1c]">
                Ready for your community
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#14201f]">
                Put your masjid's verified information in everyone's pocket.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <StoreButton platform="ios" className="shadow-none" />
              <StoreButton platform="android" className="shadow-none" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dfe5df] bg-[#f6f7f4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-[8px]" />
            <div>
              <p className="font-black text-[#14201f]">UmmahWay</p>
              <p className="text-sm text-[#697875]">
                Connecting local masjids and communities.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#536260]">
            <Link to="/privacy" className="hover:text-[#0b6b62]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#0b6b62]">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-[#0b6b62]">
              Contact
            </Link>
            <Link to="/login" className="hover:text-[#0b6b62]">
              Admin
            </Link>
            <a
              href={storeLinks.ios}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0b6b62]"
            >
              iOS
            </a>
            <a
              href={storeLinks.android}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0b6b62]"
            >
              Android
            </a>
            <span>&copy; {currentYear} UmmahWay</span>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-4 bottom-3 z-[1200] rounded-[28px] border border-[#254c46] bg-[#111827]/95 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 text-center text-[11px] font-black text-white/50">
          {[
            { href: "#", label: "Home", icon: "map" as const },
            { href: "#map", label: "Map", icon: "map" as const },
            { href: "#download", label: "App", icon: "clock" as const },
            { href: "/login", label: "Admin", icon: "shield" as const },
          ].map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} to={item.href} className="group">
                <span className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 group-hover:border-[#71e49b] group-hover:text-[#71e49b]">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="group">
                <span
                  className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full border ${
                    item.label === "App"
                      ? "border-[#5fe38f] bg-[#244f3d] text-[#76e99a]"
                      : "border-white/10 text-white/55 group-hover:border-[#71e49b] group-hover:text-[#71e49b]"
                  }`}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
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
