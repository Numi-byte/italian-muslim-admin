import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

type MasjidProfile = {
  id: string;
  slug: string;
  official_name: string;
  short_name: string | null;
  city: string;
  region: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
};

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

const prayerLabels: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const prayerOrder: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function getTodayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function displayTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "Not set";
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

const MasjidPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const today = useMemo(() => getTodayIso(), []);

  const [masjid, setMasjid] = useState<MasjidProfile | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeRow[]>([]);
  const [jumuahTimes, setJumuahTimes] = useState<JumuahRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      const { data: masjidData, error: masjidError } = await supabase
        .from("masjids")
        .select(
          "id, slug, official_name, short_name, city, region, address_line1, address_line2, postal_code, latitude, longitude, timezone"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (cancelled) return;

      if (masjidError) {
        setError(masjidError.message);
        setLoading(false);
        return;
      }

      if (!masjidData) {
        setError("Masjid not found or not active.");
        setLoading(false);
        return;
      }

      const profile = masjidData as MasjidProfile;
      setMasjid(profile);

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
  }, [slug, today]);

  const orderedPrayerTimes = useMemo(() => {
    const byPrayer = new Map(prayerTimes.map((row) => [row.prayer, row]));
    return prayerOrder.map((key) => byPrayer.get(key) ?? null);
  }, [prayerTimes]);

  const pageTitle = masjid?.short_name || masjid?.official_name || "Masjid";
  const address = masjid
    ? [masjid.address_line1, masjid.address_line2, masjid.postal_code, masjid.city]
        .filter(Boolean)
        .join(", ")
    : "";
  const mapsHref =
    masjid?.latitude != null && masjid.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${masjid.latitude},${masjid.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          address
        )}`;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050817] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#71e49b] border-t-transparent" />
          <p className="mt-4 text-sm font-black text-white/60">
            Loading masjid page...
          </p>
        </div>
      </main>
    );
  }

  if (error || !masjid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050817] px-4 text-white">
        <div className="max-w-md text-center">
          <p className="text-2xl font-black">Masjid page unavailable</p>
          <p className="mt-3 text-white/60">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-[#71e49b] px-5 py-3 text-sm font-black text-[#04100d]"
          >
            Back to UmmahWay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050817] text-white">
      <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(113,228,155,0.18),transparent_34%),radial-gradient(circle_at_80%_5%,rgba(118,80,223,0.18),transparent_32%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img src="/icon.png" alt="" className="h-10 w-10 rounded-[8px]" />
              <span className="font-black">UmmahWay</span>
            </Link>
            <Link
              to="/#map"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/75"
            >
              All masjids
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#71e49b]">
                Active masjid profile
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/65">
                {address || `${masjid.city}, ${masjid.region}`}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-full bg-[#71e49b] px-6 py-3 text-sm font-black text-[#04100d]"
                >
                  Open directions
                </a>
                <a
                  href="#prayers"
                  className="inline-flex justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white"
                >
                  Today&apos;s prayer times
                </a>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-[#0b1224] p-5">
              <p className="text-xs font-black uppercase tracking-wide text-white/45">
                Today
              </p>
              <p className="mt-1 text-2xl font-black">{today}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[16px] bg-white/5 p-4">
                  <p className="font-black text-[#71e49b]">{masjid.city}</p>
                  <p className="mt-1 text-white/50">City</p>
                </div>
                <div className="rounded-[16px] bg-white/5 p-4">
                  <p className="font-black text-[#71e49b]">
                    {masjid.timezone}
                  </p>
                  <p className="mt-1 text-white/50">Timezone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="prayers" className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[26px] border border-white/10 bg-[#0b1224] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#71e49b]">
                Prayer times
              </p>
              <h2 className="mt-1 text-2xl font-black">Today&apos;s schedule</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black text-white/55">
              Live from admin
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {orderedPrayerTimes.map((row, index) => {
              const key = prayerOrder[index];
              const start =
                key === "asr"
                  ? row?.start_time ||
                    row?.asr_start_time_hanafi ||
                    row?.asr_start_time_shafi
                  : row?.start_time;

              return (
                <div
                  key={key}
                  className="rounded-[18px] border border-white/10 bg-[#050817] p-4"
                >
                  <p className="text-lg font-black">{prayerLabels[key]}</p>
                  <p className="mt-4 text-3xl font-light text-white/70">
                    {displayTime(row?.jamaat_time)}
                  </p>
                  <p className="mt-2 text-xs font-bold text-white/45">
                    Start {displayTime(start)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="rounded-[26px] border border-[#5d35a7] bg-[#090d26] p-5">
            <p className="text-xs font-black uppercase tracking-wide text-[#bda7ff]">
              Jumu&apos;ah
            </p>
            <h2 className="mt-1 text-2xl font-black">Friday schedule</h2>
            <div className="mt-5 space-y-3">
              {jumuahTimes.length ? (
                jumuahTimes.map((row) => (
                  <div key={row.id} className="rounded-[18px] bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-black">Slot {row.slot}</p>
                      <p className="text-xl font-black text-[#71e49b]">
                        {displayTime(row.jamaat_time)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-white/55">
                      Khutbah {displayTime(row.khutbah_time)}
                      {row.language ? ` · ${row.language}` : ""}
                    </p>
                    {row.notes && (
                      <p className="mt-2 text-sm text-white/65">{row.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-[18px] bg-white/5 p-4 text-white/60">
                  No active Jumu&apos;ah schedule published yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#0b1224] p-5">
            <p className="text-xs font-black uppercase tracking-wide text-[#71e49b]">
              Announcements
            </p>
            <h2 className="mt-1 text-2xl font-black">Latest updates</h2>
            <div className="mt-5 space-y-3">
              {announcements.length ? (
                announcements.map((row) => (
                  <article key={row.id} className="rounded-[18px] bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black">{row.title}</h3>
                      <span className="rounded-full bg-[#71e49b]/15 px-2 py-1 text-[11px] font-black text-[#71e49b]">
                        {row.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {row.body}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-[18px] bg-white/5 p-4 text-white/60">
                  No active announcements right now.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MasjidPublicPage;
