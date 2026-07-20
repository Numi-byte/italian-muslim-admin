import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CountrySelector from "../components/CountrySelector";
import {
  getCountryByCode,
  inferMasjidCountryCode,
} from "../lib/countryConfig";
import { useCountryPreference } from "../lib/countryRouting";
import { supabase } from "../lib/supabaseClient";
import { STORE_LINKS, getMasjidPath, getMasjidTvUrl } from "../lib/publicLinks";
import { getCanonicalUrl, getCountryAlternates, setPageSeo } from "../lib/seo";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

type MasjidProfile = {
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
  timezone: string;
};

const PUBLIC_MASJID_COLUMNS =
  "id, slug, official_name, short_name, city, region, address_line1, address_line2, postal_code, latitude, longitude, timezone";
const PUBLIC_MASJID_COLUMNS_WITH_COUNTRY = `${PUBLIC_MASJID_COLUMNS}, country, country_code`;

type PrayerTimeRow = {
  prayer: PrayerKey;
  start_time: string | null;
  asr_start_time_shafi: string | null;
  asr_start_time_hanafi: string | null;
  jamaat_time: string | null;
};

type JumuahRow = {
  id: number;
  slot: number;
  khutbah_time: string | null;
  jamaat_time: string | null;
  language: string | null;
  notes: string | null;
  valid_from: string | null;
  valid_to: string | null;
};

type AnnouncementRow = {
  id: number;
  title: string;
  body: string;
  category: "general" | "jumuah" | "event" | "ramadan" | "urgent";
  starts_at: string | null;
  ends_at: string | null;
  is_pinned: boolean;
  created_at: string;
};

type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "clock"
  | "compass"
  | "moon"
  | "phone"
  | "pin"
  | "screen"
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
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    phone: (
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />
    ),
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

// Rub el Hizb star lattice used as a quiet backdrop on the dark sections.
const StarLattice: React.FC<{ className?: string; id: string }> = ({
  className = "",
  id,
}) => (
  <svg
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id={id}
        width="88"
        height="88"
        patternUnits="userSpaceOnUse"
      >
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

const prayerLabels: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const prayerArabic: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const prayerOrder: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const categoryLabels: Record<AnnouncementRow["category"], string> = {
  general: "Notice",
  jumuah: "Jumu'ah",
  event: "Event",
  ramadan: "Ramadan",
  urgent: "Urgent",
};

function getIsoDateForTimeZone(timeZone = "Europe/Rome") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateIso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

function formatHijriDate(dateIso: string) {
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateIso}T12:00:00Z`));
  } catch {
    return null;
  }
}

function getCurrentDayParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);

  return { minute: hour * 60 + minute, second: hour * 3600 + minute * 60 + second };
}

function timeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function displayTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "—";
}

function isCurrentlyVisible(row: AnnouncementRow, now: Date) {
  const start = row.starts_at ? new Date(row.starts_at) : null;
  const end = row.ends_at ? new Date(row.ends_at) : null;
  if (start && start > now) return false;
  if (end && end < now) return false;
  return true;
}

function isJumuahActive(row: JumuahRow, today: string) {
  if (row.valid_from && row.valid_from > today) return false;
  if (row.valid_to && row.valid_to < today) return false;
  return true;
}

function splitTrailingPunctuation(value: string) {
  const match = value.match(/^(.+?)([.,!?;:)]*)$/);
  return {
    text: match?.[1] ?? value,
    trailing: match?.[2] ?? "",
  };
}

function getSafeUrl(value: string) {
  const href = value.startsWith("www.") ? `https://${value}` : value;
  return href.startsWith("http://") || href.startsWith("https://")
    ? href
    : null;
}

function renderLinkedText(text: string) {
  const urlPattern = /(?:https?:\/\/|www\.)[^\s<]+/gi;
  const nodes: React.ReactNode[] = [];
  let key = 0;

  text.split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`br-${lineIndex}`} />);
    }

    let lastIndex = 0;

    for (const match of line.matchAll(urlPattern)) {
      const rawUrl = match[0];
      const index = match.index ?? 0;
      const { text: linkText, trailing } = splitTrailingPunctuation(rawUrl);
      const href = getSafeUrl(linkText);

      if (index > lastIndex) {
        nodes.push(line.slice(lastIndex, index));
      }

      if (href) {
        nodes.push(
          <a
            key={`link-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#0f5c46] underline decoration-[#0f5c46]/30 underline-offset-4 hover:text-[#0a3d30]"
          >
            {linkText}
          </a>
        );
      } else {
        nodes.push(linkText);
      }

      if (trailing) {
        nodes.push(trailing);
      }

      lastIndex = index + rawUrl.length;
    }

    if (lastIndex < line.length) {
      nodes.push(line.slice(lastIndex));
    }
  });

  return nodes;
}

function getPrayerStart(row: PrayerTimeRow | null, key: PrayerKey) {
  if (!row) return null;
  if (key !== "asr") return row.start_time;
  return row.start_time || row.asr_start_time_hanafi || row.asr_start_time_shafi;
}

function getAsrMethodSummary(row: PrayerTimeRow | null) {
  if (!row || row.prayer !== "asr") return null;
  const shafi = displayTime(row.asr_start_time_shafi);
  const hanafi = displayTime(row.asr_start_time_hanafi);
  if (shafi === "—" && hanafi === "—") return null;
  if (shafi === hanafi) return null;
  return `Shafi'i ${shafi} · Hanafi ${hanafi}`;
}

function getAddress(masjid: MasjidProfile) {
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

function getMapsHref(masjid: MasjidProfile) {
  if (masjid.latitude != null && masjid.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${masjid.latitude},${masjid.longitude}`;
  }

  const query = getAddress(masjid) || `${masjid.official_name}, ${masjid.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  return `${minutes}m ${pad(seconds)}s`;
}

const MasjidPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const countryPreference = useCountryPreference();

  const [pageDate, setPageDate] = useState(() => getIsoDateForTimeZone());
  const [masjid, setMasjid] = useState<MasjidProfile | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeRow[]>([]);
  const [jumuahTimes, setJumuahTimes] = useState<JumuahRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      const countryResult = await supabase
        .from("public_masjids")
        .select(PUBLIC_MASJID_COLUMNS_WITH_COUNTRY)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      let masjidData = countryResult.data as MasjidProfile | null;
      let masjidError = countryResult.error;

      if (masjidError) {
        const fallback = await supabase
          .from("public_masjids")
          .select(PUBLIC_MASJID_COLUMNS)
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();
        masjidData = fallback.data as MasjidProfile | null;
        masjidError = fallback.error;
      }

      if (cancelled) return;

      if (masjidError) {
        setError(masjidError.message);
        setLoading(false);
        return;
      }

      if (!masjidData) {
        setError("This masjid page is not available.");
        setLoading(false);
        return;
      }

      const profile = masjidData as MasjidProfile;
      const today = getIsoDateForTimeZone(profile.timezone || "Europe/Rome");
      setMasjid(profile);
      setPageDate(today);

      const [prayersResult, jumuahResult, announcementsResult] =
        await Promise.all([
          supabase
            .from("masjid_prayer_times")
            .select(
              "prayer, start_time, asr_start_time_shafi, asr_start_time_hanafi, jamaat_time"
            )
            .eq("masjid_id", profile.id)
            .eq("date", today),
          supabase
            .from("masjid_jumuah_times")
            .select(
              "id, slot, khutbah_time, jamaat_time, language, notes, valid_from, valid_to"
            )
            .eq("masjid_id", profile.id)
            .order("slot", { ascending: true }),
          supabase
            .from("masjid_announcements")
            .select(
              "id, title, body, category, starts_at, ends_at, is_pinned, created_at"
            )
            .eq("masjid_id", profile.id)
            .order("is_pinned", { ascending: false })
            .order("starts_at", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      if (cancelled) return;

      if (prayersResult.error) {
        setError(prayersResult.error.message);
      } else {
        setPrayerTimes((prayersResult.data ?? []) as PrayerTimeRow[]);
      }

      if (!jumuahResult.error) {
        setJumuahTimes(
          ((jumuahResult.data ?? []) as JumuahRow[]).filter((row) =>
            isJumuahActive(row, today)
          )
        );
      }

      if (!announcementsResult.error) {
        const now = new Date();
        setAnnouncements(
          ((announcementsResult.data ?? []) as AnnouncementRow[]).filter((row) =>
            isCurrentlyVisible(row, now)
          )
        );
      }

      setLoading(false);
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Drive the live jama'ah countdown.
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const orderedPrayerTimes = useMemo(() => {
    const byPrayer = new Map(prayerTimes.map((row) => [row.prayer, row]));
    return prayerOrder.map((key) => byPrayer.get(key) ?? null);
  }, [prayerTimes]);

  const timeZone = masjid?.timezone || "Europe/Rome";
  const pageCountry =
    getCountryByCode(masjid ? inferMasjidCountryCode(masjid) : null) ??
    countryPreference.country;

  // Which jama'ah is next, plus a live second-by-second countdown to it.
  const schedule = useMemo(() => {
    void nowTick; // recompute every tick
    const { minute: nowMinute, second: nowSecond } = getCurrentDayParts(timeZone);

    const rows = orderedPrayerTimes.map((row, index) => {
      const key = prayerOrder[index];
      return {
        key,
        label: prayerLabels[key],
        arabic: prayerArabic[key],
        begins: displayTime(getPrayerStart(row, key)),
        jamaah: displayTime(row?.jamaat_time),
        jamaahMinutes: timeToMinutes(row?.jamaat_time),
        note: getAsrMethodSummary(row),
      };
    });

    const withTimes = rows.filter((row) => row.jamaahMinutes != null);
    const upcoming = withTimes.find(
      (row) => (row.jamaahMinutes as number) >= nowMinute
    );
    // Once the day's prayers have passed, the next jama'ah is tomorrow's Fajr.
    const nextRow = upcoming ?? withTimes[0] ?? null;

    let countdownSeconds: number | null = null;
    if (nextRow?.jamaahMinutes != null) {
      let target = nextRow.jamaahMinutes * 60;
      if (!upcoming) target += 24 * 3600; // wraps to the next day
      countdownSeconds = Math.max(0, target - nowSecond);
    }

    return { rows, nextKey: nextRow?.key ?? null, nextRow, countdownSeconds };
  }, [orderedPrayerTimes, timeZone, nowTick]);

  useEffect(() => {
    if (!masjid) return;

    const titleName = masjid.short_name || masjid.official_name;
    const path = getMasjidPath(masjid.slug);
    const canonicalUrl = getCanonicalUrl(pageCountry.code, path);
    const description = `${masjid.official_name} in ${masjid.city}, ${pageCountry.name}: daily prayer times, Jumu'ah timetable, announcements, directions, and UmmahWay TV display.`;

    setPageSeo({
      title: `${titleName} Prayer Times & Jumu'ah | UmmahWay`,
      description,
      canonicalUrl,
      alternates: getCountryAlternates(path),
      imageUrl: `${window.location.origin}/icon.png`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Mosque",
          name: masjid.official_name,
          alternateName: masjid.short_name ?? undefined,
          url: canonicalUrl,
          address: {
            "@type": "PostalAddress",
            streetAddress: [masjid.address_line1, masjid.address_line2]
              .filter(Boolean)
              .join(", "),
            addressLocality: masjid.city,
            addressRegion: masjid.region ?? undefined,
            postalCode: masjid.postal_code ?? undefined,
            addressCountry: pageCountry.countryIso,
          },
          geo:
            masjid.latitude != null && masjid.longitude != null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: masjid.latitude,
                  longitude: masjid.longitude,
                }
              : undefined,
          description,
          areaServed: pageCountry.countryIso,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "UmmahWay",
              item: getCanonicalUrl(pageCountry.code, "/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: `Masjids in ${pageCountry.name}`,
              item: getCanonicalUrl(pageCountry.code, "/masjids"),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: titleName,
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
  }, [masjid, pageCountry]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ec] px-4 text-[#1c2b26]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0f5c46] border-t-transparent" />
          <p className="mt-4 font-arabic text-lg text-[#8a7a52]">
            بسم الله الرحمن الرحيم
          </p>
        </div>
      </main>
    );
  }

  if (error || !masjid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ec] px-4 text-[#1c2b26]">
        <div className="max-w-md rounded-2xl border border-[#e7e1d3] bg-white p-8 text-center shadow-sm">
          <p className="font-display text-3xl font-semibold">
            Page unavailable
          </p>
          <p className="mt-3 text-[#6b7a74]">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a3d30]"
          >
            Back to all masjids
          </Link>
        </div>
      </main>
    );
  }

  const pageTitle = masjid.short_name || masjid.official_name;
  const address = getAddress(masjid);
  const mapsHref = getMapsHref(masjid);
  const tvHref = getMasjidTvUrl();
  const displayDate = formatDisplayDate(pageDate, timeZone);
  const hijriDate = formatHijriDate(pageDate);
  const heroAnnouncement = announcements[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c2b26] antialiased">
      <header className="sticky top-0 z-50 border-b border-[#e7e1d3] bg-[#f7f4ec]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg" />
            <div className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-tight">
                {pageTitle}
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a8c68] sm:block">
                {masjid.city}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#4a5852] md:flex">
            <a href="#prayers" className="hover:text-[#0f5c46]">
              Prayer Times
            </a>
            <a href="#jumuah" className="hover:text-[#0f5c46]">
              Jumu'ah
            </a>
            <a href="#news" className="hover:text-[#0f5c46]">
              News
            </a>
            <a href="#visit" className="hover:text-[#0f5c46]">
              Visit Us
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <CountrySelector
              selectedCode={pageCountry.code}
              currentPath="/masjids"
              className="hidden text-[#4a5852] lg:inline-flex"
            />
            <a
              href={tvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-[#d8cfb8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40 sm:inline-flex"
            >
              <Icon name="screen" className="h-4 w-4" />
              Display
            </a>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f5c46] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#0a3d30]"
            >
              <Icon name="pin" className="h-4 w-4" />
              Directions
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — masjid identity, date, and the next jama'ah countdown */}
        <section className="relative overflow-hidden bg-[#0a3d30] text-white">
          <StarLattice
            id="hero-lattice"
            className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.07]"
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(230,207,154,.5), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-20">
            <p className="font-arabic text-2xl text-[#e6cf9a] sm:text-3xl">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>

            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
              {masjid.official_name}
            </h1>
            {masjid.short_name &&
              masjid.short_name !== masjid.official_name && (
                <p className="mt-3 text-base font-medium uppercase tracking-[0.22em] text-[#e6cf9a]/90">
                  {masjid.short_name}
                </p>
              )}

            <p className="mx-auto mt-5 flex max-w-2xl items-center justify-center gap-2 text-white/70">
              <Icon name="pin" className="h-4 w-4 flex-none text-[#e6cf9a]" />
              <span>
                {address ||
                  `${masjid.city}${masjid.region ? `, ${masjid.region}` : ""}`}
              </span>
            </p>
            <p className="mt-3 text-sm font-semibold text-[#e6cf9a]">
              {pageCountry.name}
            </p>

            <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-1.5 text-sm text-white/75 sm:flex-row sm:gap-4">
              <span className="inline-flex items-center gap-2">
                <Icon name="calendar" className="h-4 w-4 text-[#e6cf9a]" />
                {displayDate}
              </span>
              {hijriDate && (
                <>
                  <span className="hidden text-[#e6cf9a]/40 sm:inline">•</span>
                  <span className="inline-flex items-center gap-2 font-arabic text-base text-[#e6cf9a]">
                    <Icon name="moon" className="h-4 w-4" />
                    {hijriDate}
                  </span>
                </>
              )}
            </div>

            {/* Next jama'ah — the piece a visitor looks for first */}
            <div className="mx-auto mt-10 inline-flex w-full max-w-md flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e6cf9a]">
                Next Jama'ah
              </p>
              {schedule.nextRow ? (
                <>
                  <div className="mt-2 flex items-baseline justify-center gap-3">
                    <span className="font-display text-4xl font-semibold sm:text-5xl">
                      {schedule.nextRow.label}
                    </span>
                    <span className="font-display text-4xl font-light text-[#e6cf9a] sm:text-5xl">
                      {schedule.nextRow.jamaah}
                    </span>
                  </div>
                  {schedule.countdownSeconds != null && (
                    <p className="mt-2 text-sm text-white/60">
                      in {formatCountdown(schedule.countdownSeconds)}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-sm text-white/60">
                  Today's timetable has not been published yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Prayer timetable — the centrepiece of the page */}
        <section id="prayers" className="relative -mt-8 pb-4">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-[#e7e1d3] bg-white shadow-xl shadow-[#0a3d30]/10">
              <div className="flex flex-col gap-1 border-b border-[#efeadd] bg-[#faf8f1] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#1c2b26]">
                    Prayer Timetable
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7a74]">
                    Today, {displayDate}
                  </p>
                </div>
                <div className="hidden items-center gap-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a8c68] sm:flex">
                  <span>Begins</span>
                  <span className="text-[#0f5c46]">Jama'ah</span>
                </div>
              </div>

              <div className="divide-y divide-[#efeadd]">
                {schedule.rows.map((row) => {
                  const isNext = row.key === schedule.nextKey;
                  return (
                    <div
                      key={row.key}
                      className={`grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition sm:grid-cols-[1.4fr_1fr_1fr] ${
                        isNext ? "bg-[#0f5c46]/[0.05]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${
                            isNext
                              ? "bg-[#0f5c46] text-[#e6cf9a]"
                              : "bg-[#f2efe4] text-[#0f5c46]"
                          }`}
                        >
                          <Icon name="clock" className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="flex items-center gap-2 font-display text-xl font-semibold leading-none">
                            {row.label}
                            {isNext && (
                              <span className="rounded-full bg-[#0f5c46] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                Next
                              </span>
                            )}
                          </p>
                          <p className="mt-1 font-arabic text-base text-[#9a8c68]">
                            {row.arabic}
                          </p>
                        </div>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b0a483] sm:hidden">
                          Begins
                        </p>
                        <p className="text-lg font-medium tabular-nums text-[#4a5852]">
                          {row.begins}
                        </p>
                        {row.note && (
                          <p className="mt-0.5 text-[11px] text-[#9a8c68]">
                            {row.note}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b0a483] sm:hidden">
                          Jama'ah
                        </p>
                        <p
                          className={`font-display text-2xl font-semibold tabular-nums ${
                            isNext ? "text-[#0f5c46]" : "text-[#1c2b26]"
                          }`}
                        >
                          {row.jamaah}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Jumu'ah + News */}
        <section className="py-14 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
            <div id="jumuah">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#d8cfb8]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                  Friday
                </p>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Jumu'ah Prayer
              </h2>

              <div className="mt-6 space-y-3">
                {jumuahTimes.length ? (
                  jumuahTimes.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-[#e7e1d3] bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-display text-xl font-semibold">
                            {jumuahTimes.length > 1
                              ? `${row.slot === 1 ? "First" : row.slot === 2 ? "Second" : `Slot ${row.slot}`} Jama'ah`
                              : "Congregation"}
                          </h3>
                          <p className="mt-1 text-sm text-[#6b7a74]">
                            Khutbah {displayTime(row.khutbah_time)}
                            {row.language ? ` · ${row.language}` : ""}
                          </p>
                        </div>
                        <p className="font-display text-3xl font-semibold text-[#0f5c46]">
                          {displayTime(row.jamaat_time)}
                        </p>
                      </div>
                      {row.notes && (
                        <p className="mt-3 border-t border-[#efeadd] pt-3 text-sm leading-6 text-[#6b7a74]">
                          {row.notes}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-[#e7e1d3] bg-white p-5 text-sm text-[#6b7a74]">
                    The Jumu'ah timetable will appear here once it is set.
                  </p>
                )}
              </div>
            </div>

            <div id="news">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#d8cfb8]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                  From the masjid
                </p>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                News &amp; Notices
              </h2>

              <div className="mt-6 space-y-3">
                {announcements.length ? (
                  announcements.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-[#e7e1d3] bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="font-display text-xl font-semibold">
                          {row.title}
                        </h3>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            row.category === "urgent"
                              ? "bg-[#f7e4dc] text-[#9b3f28]"
                              : "bg-[#f2efe4] text-[#0f5c46]"
                          }`}
                        >
                          {categoryLabels[row.category]}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#4a5852]">
                        {renderLinkedText(row.body)}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-[#e7e1d3] bg-white p-5 text-sm text-[#6b7a74]">
                    There are no notices at the moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="bg-white py-14 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#d8cfb8]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                  Find us
                </p>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
                Visit the masjid
              </h2>
              <p className="mt-4 max-w-xl leading-8 text-[#4a5852]">
                {address
                  ? `You'll find us at ${address}. Everyone is welcome for the five daily prayers and Jumu'ah.`
                  : `${masjid.official_name} is in ${masjid.city}. Everyone is welcome for the five daily prayers and Jumu'ah.`}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    href: mapsHref,
                    icon: "compass" as const,
                    label: "Directions",
                    text: "Open in Maps",
                  },
                  {
                    href: tvHref,
                    icon: "screen" as const,
                    label: "Hall Display",
                    text: "Timetable screen",
                  },
                  {
                    href: STORE_LINKS.ios,
                    icon: "phone" as const,
                    label: "Mobile App",
                    text: "Times on the go",
                  },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-[#e7e1d3] bg-[#faf8f1] p-4 transition hover:border-[#0f5c46]/40 hover:bg-[#f4f6f0]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f5c46] text-[#e6cf9a]">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-4 block font-display text-lg font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-[#6b7a74]">
                      {item.text}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-2xl bg-[#0a3d30] p-7 text-white">
              <StarLattice
                id="visit-lattice"
                className="absolute inset-0 h-full w-full text-[#e6cf9a] opacity-[0.06]"
              />
              <div className="relative">
                <p className="font-arabic text-xl text-[#e6cf9a]">
                  حَيَّ عَلَى الصَّلَاة
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold">
                  A house of prayer for the community
                </h3>
                <div className="mt-6 grid gap-3">
                  {[
                    "Five daily prayers in congregation",
                    "Jumu'ah khutbah and prayer every Friday",
                    "Timetable kept current throughout the year",
                    "Ramadan, Eid and community gatherings",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#e6cf9a] text-[#0a3d30]">
                        <Icon name="check" className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm leading-6 text-white/80">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {heroAnnouncement && (
                  <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e6cf9a]">
                      Latest notice
                    </p>
                    <h4 className="mt-2 font-display text-lg font-semibold">
                      {heroAnnouncement.title}
                    </h4>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-white/70">
                      {heroAnnouncement.body}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e7e1d3] bg-[#faf8f1]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-display text-lg font-semibold">{pageTitle}</p>
              <p className="text-sm text-[#6b7a74]">
                {address || masjid.city}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-[#4a5852]">
            <Link to="/" className="hover:text-[#0f5c46]">
              All masjids
            </Link>
            <a
              href={tvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0f5c46]"
            >
              Display
            </a>
            <Link to="/privacy" className="hover:text-[#0f5c46]">
              Privacy
            </Link>
            <Link to="/contact" className="hover:text-[#0f5c46]">
              Contact
            </Link>
          </div>
        </div>
        <div className="border-t border-[#efeadd] py-4 text-center text-xs text-[#9a8c68]">
          Prayer times and notices maintained by the masjid · UmmahWay
        </div>
      </footer>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-[#0f5c46]/40 bg-[#0a3d30]/95 px-2 py-2 text-white shadow-2xl shadow-black/30 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 text-center text-[11px] font-medium text-white/70">
          {[
            { href: "#prayers", label: "Prayers", icon: "clock" as const },
            { href: "#jumuah", label: "Jumu'ah", icon: "calendar" as const },
            { href: "#news", label: "News", icon: "bell" as const },
            { href: tvHref, label: "Display", icon: "screen" as const },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={
                item.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              className="group py-1"
            >
              <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 group-hover:border-[#e6cf9a] group-hover:text-[#e6cf9a]">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MasjidPublicPage;
