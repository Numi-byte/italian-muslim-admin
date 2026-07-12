// src/pages/PrayerTimesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/authContext";

type Masjid = {
  id: string;
  official_name: string;
  city: string;
  region: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

type PrayerRow = {
  id: number | null; // null = not saved yet
  masjid_id: string;
  date: string; // YYYY-MM-DD
  prayer: PrayerKey;
  start_time: string; // HH:MM
  asr_start_time_shafi: string; // HH:MM
  asr_start_time_hanafi: string; // HH:MM
  jamaat_time: string; // HH:MM
};

type PrayerTimeDbRow = {
  id: number;
  masjid_id: string;
  date: string;
  prayer: PrayerKey;
  start_time: string | null; // "HH:MM:SS"
  asr_start_time_shafi: string | null; // "HH:MM:SS"
  asr_start_time_hanafi: string | null; // "HH:MM:SS"
  jamaat_time: string | null; // "HH:MM:SS"
};

type AlAdhanTimingKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

type AlAdhanTimings = Partial<Record<AlAdhanTimingKey, string>>;

type AlAdhanTimingsResponse = {
  code?: number;
  status?: string;
  data?: {
    timings?: AlAdhanTimings;
  };
};

type ImportedAdhanDay = {
  date: string;
  fajr: string;
  dhuhr: string;
  asrShafi: string;
  asrHanafi: string;
  maghrib: string;
  isha: string;
};

type MasjidLocationSource =
  | {
      type: "coordinates";
      latitude: number;
      longitude: number;
      label: string;
    }
  | {
      type: "city";
      city: string;
      country: string;
      label: string;
    };

type AdhanImportPayloadRow = {
  masjid_id: string;
  date: string;
  prayer: PrayerKey;
  start_time: string;
  asr_start_time_shafi: string | null;
  asr_start_time_hanafi: string | null;
};

const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

const DEFAULT_IMPORT_COUNTRY = "Italy";
const MUSLIM_WORLD_LEAGUE_METHOD_ID = 3;
const WEEK_IMPORT_DAYS = 7;

const getTodayIsoRome = (): string => {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return iso;
};

const isoDateToUtcDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const shiftIsoDate = (isoDate: string, deltaDays: number): string => {
  const date = isoDateToUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
};

const formatAlAdhanDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

const parseApiTime = (value: string | undefined): string | null => {
  const match = value?.match(/\b([0-2]\d):([0-5]\d)\b/);
  const hour = match?.[1];
  const minute = match?.[2];
  return hour && minute ? `${hour}:${minute}` : null;
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const requirePrayerTime = (
  timings: AlAdhanTimings | undefined,
  key: AlAdhanTimingKey,
  date: string
): string => {
  const time = parseApiTime(timings?.[key]);
  if (!time) {
    throw new Error(`AlAdhan did not return a valid ${key} time for ${date}.`);
  }
  return time;
};

const getMasjidLocationSource = (masjid: Masjid): MasjidLocationSource => {
  if (
    typeof masjid.latitude === "number" &&
    typeof masjid.longitude === "number" &&
    Number.isFinite(masjid.latitude) &&
    Number.isFinite(masjid.longitude)
  ) {
    return {
      type: "coordinates",
      latitude: masjid.latitude,
      longitude: masjid.longitude,
      label: `${masjid.latitude.toFixed(5)}, ${masjid.longitude.toFixed(5)}`,
    };
  }

  const city = masjid.city.trim();
  const locationParts = [city, masjid.region, DEFAULT_IMPORT_COUNTRY].filter(
    Boolean
  );

  return {
    type: "city",
    city,
    country: DEFAULT_IMPORT_COUNTRY,
    label: locationParts.join(", "),
  };
};

const fetchMasjidTimings = async (
  date: string,
  school: 0 | 1,
  location: MasjidLocationSource
) => {
  const url =
    location.type === "coordinates"
      ? new URL(`https://api.aladhan.com/v1/timings/${formatAlAdhanDate(date)}`)
      : new URL(
          `https://api.aladhan.com/v1/timingsByCity/${formatAlAdhanDate(date)}`
        );

  if (location.type === "coordinates") {
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
  } else {
    url.searchParams.set("city", location.city);
    url.searchParams.set("country", location.country);
  }

  url.searchParams.set("method", String(MUSLIM_WORLD_LEAGUE_METHOD_ID));
  url.searchParams.set("school", String(school));

  let payload: AlAdhanTimingsResponse | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url.toString());

      if (response.ok) {
        payload = (await response.json()) as AlAdhanTimingsResponse;
        break;
      }

      lastError = `AlAdhan returned ${response.status} for ${location.label} on ${date}.`;
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : `AlAdhan request failed for ${location.label} on ${date}.`;
    }

    await wait(700 * (attempt + 1));
  }

  if (!payload) {
    throw new Error(
      lastError ?? `AlAdhan request failed for ${location.label} on ${date}.`
    );
  }

  if (payload.code !== 200 || !payload.data?.timings) {
    throw new Error(`AlAdhan returned no timings for ${date}.`);
  }

  return payload.data.timings;
};

const fetchMasjidMwlWeek = async (
  dates: string[],
  location: MasjidLocationSource
): Promise<ImportedAdhanDay[]> => {
  const importedDays: ImportedAdhanDay[] = [];

  for (const date of dates) {
    const shafiTimings = await fetchMasjidTimings(date, 0, location);
    const hanafiTimings = await fetchMasjidTimings(date, 1, location);

    importedDays.push({
      date,
      fajr: requirePrayerTime(shafiTimings, "Fajr", date),
      dhuhr: requirePrayerTime(shafiTimings, "Dhuhr", date),
      asrShafi: requirePrayerTime(shafiTimings, "Asr", date),
      asrHanafi: requirePrayerTime(hanafiTimings, "Asr", date),
      maghrib: requirePrayerTime(shafiTimings, "Maghrib", date),
      isha: requirePrayerTime(shafiTimings, "Isha", date),
    });

    await wait(150);
  }

  return importedDays;
};

const withSeconds = (time: string): string => `${time}:00`;

const buildAdhanImportPayload = (
  masjidId: string,
  week: ImportedAdhanDay[]
): AdhanImportPayloadRow[] =>
  week.flatMap((day) => [
    {
      masjid_id: masjidId,
      date: day.date,
      prayer: "fajr",
      start_time: withSeconds(day.fajr),
      asr_start_time_shafi: null,
      asr_start_time_hanafi: null,
    },
    {
      masjid_id: masjidId,
      date: day.date,
      prayer: "dhuhr",
      start_time: withSeconds(day.dhuhr),
      asr_start_time_shafi: null,
      asr_start_time_hanafi: null,
    },
    {
      masjid_id: masjidId,
      date: day.date,
      prayer: "asr",
      start_time: withSeconds(day.asrShafi),
      asr_start_time_shafi: withSeconds(day.asrShafi),
      asr_start_time_hanafi: withSeconds(day.asrHanafi),
    },
    {
      masjid_id: masjidId,
      date: day.date,
      prayer: "maghrib",
      start_time: withSeconds(day.maghrib),
      asr_start_time_shafi: null,
      asr_start_time_hanafi: null,
    },
    {
      masjid_id: masjidId,
      date: day.date,
      prayer: "isha",
      start_time: withSeconds(day.isha),
      asr_start_time_shafi: null,
      asr_start_time_hanafi: null,
    },
  ]);

const formatDayLabel = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`));

const formatFullDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));

const PrayerTimesPage: React.FC = () => {
  const { isAdmin, isPrayerTimingEditor, accessiblePrayerMasjidIds } =
    useAuth();
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [selectedMasjidId, setSelectedMasjidId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayIsoRome()
  );

  const [rows, setRows] = useState<PrayerRow[]>([]);
  const [loadingMasjids, setLoadingMasjids] = useState(false);
  const [loadingPrayers, setLoadingPrayers] = useState(false);
  const [savingAdhan, setSavingAdhan] = useState(false);
  const [savingJamaat, setSavingJamaat] = useState(false);
  const [applyingCityAdhan, setApplyingCityAdhan] = useState(false);
  const [importingMasjidAdhan, setImportingMasjidAdhan] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [selectedCityMasjidIds, setSelectedCityMasjidIds] = useState<string[]>(
    []
  );
  const isLimitedPrayerEditor = isPrayerTimingEditor && !isAdmin;

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === selectedMasjidId) ?? null,
    [masjids, selectedMasjidId]
  );

  const selectedMasjidImportLocation = useMemo(
    () => (selectedMasjid ? getMasjidLocationSource(selectedMasjid) : null),
    [selectedMasjid]
  );

  const weeklyImportEndDate = useMemo(
    () =>
      selectedDate ? shiftIsoDate(selectedDate, WEEK_IMPORT_DAYS - 1) : "",
    [selectedDate]
  );

  const daySelectorDays = useMemo(
    () =>
      [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
        const date = shiftIsoDate(selectedDate, offset);
        return {
          date,
          label: offset === 0 ? "Selected" : formatDayLabel(date),
          compactLabel:
            offset === 0 ? formatDayLabel(date) : formatDayLabel(date),
        };
      }),
    [selectedDate]
  );

  const sameCityMasjids = useMemo(() => {
    if (!selectedMasjid) return [];
    return masjids.filter(
      (m) => m.city === selectedMasjid.city && m.id !== selectedMasjid.id
    );
  }, [masjids, selectedMasjid]);

  useEffect(() => {
    setSelectedCityMasjidIds([]);
  }, [selectedMasjidId, selectedDate]);

  // ---------------------------------------------------------------------------
  // Load masjids
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadMasjids = async () => {
      setLoadingMasjids(true);

      const locationResult = await supabase
        .from("public_masjids")
        .select(
          "id, official_name, city, region, address_line1, address_line2, postal_code, latitude, longitude"
        )
        .order("city", { ascending: true });
      let data = locationResult.data as Partial<Masjid>[] | null;
      let error = locationResult.error;

      if (error) {
        console.warn(
          "Could not load masjid coordinates from public_masjids; falling back to city lookup.",
          error
        );
        const fallbackResult = await supabase
          .from("public_masjids")
          .select("id, official_name, city")
          .order("city", { ascending: true });
        data = fallbackResult.data as Partial<Masjid>[] | null;
        error = fallbackResult.error;
      }

      if (error) {
        console.error("Error loading masjids", error);
        setMasjids([]);
      } else if (data) {
        const allMasjidRows = data.map((row) => ({
          id: row.id ?? "",
          official_name: row.official_name ?? "",
          city: row.city ?? "",
          region: row.region ?? null,
          address_line1: row.address_line1 ?? null,
          address_line2: row.address_line2 ?? null,
          postal_code: row.postal_code ?? null,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
        }));
        const masjidRows = isLimitedPrayerEditor
          ? allMasjidRows.filter((masjid) =>
              accessiblePrayerMasjidIds.includes(masjid.id)
            )
          : allMasjidRows;
        setMasjids(masjidRows);
        if (masjidRows.length > 0) {
          setSelectedMasjidId((prev) =>
            prev && masjidRows.some((masjid) => masjid.id === prev)
              ? prev
              : masjidRows[0].id
          );
        } else {
          setSelectedMasjidId(null);
        }
      }

      setLoadingMasjids(false);
    };

    void loadMasjids();
  }, [accessiblePrayerMasjidIds, isLimitedPrayerEditor]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const buildEmptyRows = (masjidId: string, date: string): PrayerRow[] =>
    PRAYERS.map((p) => ({
      id: null,
      masjid_id: masjidId,
      date,
      prayer: p.key,
      start_time: "",
      asr_start_time_shafi: "",
      asr_start_time_hanafi: "",
      jamaat_time: "",
    }));

  const loadPrayerTimes = async (masjidId: string, date: string) => {
    setLoadingPrayers(true);
    setMessage(null);
    setMessageType(null);
    setDirty(false); // fresh load = no unsaved changes

    const { data, error } = await supabase
      .from("masjid_prayer_times")
      .select("*")
      .eq("masjid_id", masjidId)
      .eq("date", date)
      .order("prayer", { ascending: true });

    if (error) {
      console.error("Error loading masjid_prayer_times", error);
      setRows(buildEmptyRows(masjidId, date));
      setMessage(error.message);
      setMessageType("error");
    } else if (!data || data.length === 0) {
      // no times defined yet → empty template
      setRows(buildEmptyRows(masjidId, date));
    } else {
      const existing = data as PrayerTimeDbRow[];
      const map = new Map<PrayerKey, PrayerRow>();

      for (const row of existing) {
        map.set(row.prayer, {
          id: row.id,
          masjid_id: row.masjid_id,
          date: row.date,
          prayer: row.prayer,
          start_time:
            row.prayer === "asr"
              ? row.start_time?.slice(0, 5) ??
                row.asr_start_time_shafi?.slice(0, 5) ??
                row.asr_start_time_hanafi?.slice(0, 5) ??
                ""
              : row.start_time?.slice(0, 5) ?? "", // HH:MM:SS -> HH:MM
          asr_start_time_shafi: row.asr_start_time_shafi?.slice(0, 5) ?? "",
          asr_start_time_hanafi: row.asr_start_time_hanafi?.slice(0, 5) ?? "",
          jamaat_time: row.jamaat_time?.slice(0, 5) ?? "",
        });
      }

      const merged: PrayerRow[] = PRAYERS.map((p) => {
        const found = map.get(p.key);
        if (found) return found;
        return {
          id: null,
          masjid_id: masjidId,
          date,
          prayer: p.key,
          start_time: "",
          asr_start_time_shafi: "",
          asr_start_time_hanafi: "",
          jamaat_time: "",
        };
      });

      setRows(merged);
    }

    setLoadingPrayers(false);
  };

  // load when masjid or date changes
  useEffect(() => {
    if (!selectedMasjidId || !selectedDate) {
      setRows([]);
      return;
    }
    void loadPrayerTimes(selectedMasjidId, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMasjidId, selectedDate]);

  const updateRow = (
    prayerKey: PrayerKey,
    patch: Partial<
      Pick<
        PrayerRow,
        | "start_time"
        | "asr_start_time_shafi"
        | "asr_start_time_hanafi"
        | "jamaat_time"
      >
    >
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.prayer === prayerKey ? { ...r, ...patch } : r))
    );
    setMessage(null);
    setMessageType(null);
    setDirty(true);
  };

  const buildAsrTimingPayload = (
    row: Pick<
      PrayerRow,
      "start_time" | "asr_start_time_shafi" | "asr_start_time_hanafi"
    >
  ) => ({
    start_time:
      row.asr_start_time_shafi || row.asr_start_time_hanafi || row.start_time
        ? `${
            row.asr_start_time_shafi ||
            row.asr_start_time_hanafi ||
            row.start_time
          }:00`
        : null,
    asr_start_time_shafi: row.asr_start_time_shafi
      ? `${row.asr_start_time_shafi}:00`
      : null,
    asr_start_time_hanafi: row.asr_start_time_hanafi
      ? `${row.asr_start_time_hanafi}:00`
      : null,
  });

  const handleCopyFromPreviousDay = async (mode: "both" | "jamaat") => {
    if (!selectedMasjidId || !selectedDate) return;

    const current = new Date(selectedDate);
    const prevDate = new Date(current.getTime() - 24 * 60 * 60 * 1000);
    const prevIso = prevDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("masjid_prayer_times")
      .select("*")
      .eq("masjid_id", selectedMasjidId)
      .eq("date", prevIso)
      .order("prayer", { ascending: true });

    if (error || !data || data.length === 0) {
      setMessage("No prayer times found for the previous day to copy from.");
      setMessageType("error");
      return;
    }

    const existing = data as PrayerTimeDbRow[];
    const map = new Map<
      PrayerKey,
      { start: string; asrShafi: string; asrHanafi: string; jamaat: string }
    >();

    for (const row of existing) {
      map.set(row.prayer, {
        start: row.start_time?.slice(0, 5) ?? "",
        asrShafi: row.asr_start_time_shafi?.slice(0, 5) ?? "",
        asrHanafi: row.asr_start_time_hanafi?.slice(0, 5) ?? "",
        jamaat: row.jamaat_time?.slice(0, 5) ?? "",
      });
    }

    setRows((prev) =>
      prev.map((r) => {
        const fromPrev = map.get(r.prayer);
        if (!fromPrev) return r;
        return {
          ...r,
          start_time: mode === "both" ? fromPrev.start : r.start_time,
          asr_start_time_shafi:
            mode === "both" ? fromPrev.asrShafi : r.asr_start_time_shafi,
          asr_start_time_hanafi:
            mode === "both" ? fromPrev.asrHanafi : r.asr_start_time_hanafi,
          jamaat_time: fromPrev.jamaat,
        };
      })
    );
    setMessage(
      mode === "both"
        ? `Copied adhan and jamā‘ah times from ${prevIso} into the current day (not yet saved).`
        : `Copied jamā‘ah times from ${prevIso} into the current day (not yet saved).`
    );
    setMessageType("success");
    setDirty(true);
  };

  const handleChangeDateBy = (deltaDays: number) => {
    setMessage(null);
    setMessageType(null);
    setDirty(false);
    setSelectedDate((prev) => {
      if (!prev) return getTodayIsoRome();
      const d = new Date(prev);
      if (Number.isNaN(d.getTime())) return getTodayIsoRome();
      d.setDate(d.getDate() + deltaDays);
      return d.toISOString().slice(0, 10);
    });
  };

  const handleGoToday = () => {
    setMessage(null);
    setMessageType(null);
    setDirty(false);
    setSelectedDate(getTodayIsoRome());
  };

  const handleSelectDate = (date: string) => {
    setMessage(null);
    setMessageType(null);
    setDirty(false);
    setSelectedDate(date);
  };

  const handleClearAllLocal = () => {
    if (!selectedMasjidId || !selectedDate) return;
    setRows(buildEmptyRows(selectedMasjidId, selectedDate));
    setMessage("All times cleared locally. Click Save to apply.");
    setMessageType("success");
    setDirty(true);
  };

  const handleSave = async (
    field: "start_time" | "jamaat_time",
    setSaving: React.Dispatch<React.SetStateAction<boolean>>,
    successLabel: string
  ) => {
    if (!selectedMasjidId || !selectedDate) return;

    const toSave =
      field === "start_time"
        ? rows
            .filter((r) =>
              r.prayer === "asr"
                ? Boolean(r.asr_start_time_shafi || r.asr_start_time_hanafi)
                : Boolean(r.start_time)
            )
            .map((r) => ({
              masjid_id: r.masjid_id,
              date: r.date,
              prayer: r.prayer,
              start_time:
                r.prayer === "asr"
                  ? `${
                      r.asr_start_time_shafi || r.asr_start_time_hanafi || ""
                    }:00`
                  : `${r.start_time}:00`,
              asr_start_time_shafi: r.asr_start_time_shafi
                ? `${r.asr_start_time_shafi}:00`
                : null,
              asr_start_time_hanafi: r.asr_start_time_hanafi
                ? `${r.asr_start_time_hanafi}:00`
                : null,
            }))
        : rows
            .filter((r) => Boolean(r[field]))
            .map((r) => ({
              masjid_id: r.masjid_id,
              date: r.date,
              prayer: r.prayer,
              [field]: `${r[field]}:00`,
              ...(isLimitedPrayerEditor
                ? {}
                : r.prayer === "asr"
                  ? buildAsrTimingPayload(r)
                  : {
                      start_time: r.start_time ? `${r.start_time}:00` : null,
                      asr_start_time_shafi: null,
                      asr_start_time_hanafi: null,
                    }),
            }));

    setSaving(true);
    setMessage(null);
    setMessageType(null);

    try {
      if (toSave.length === 0) {
        const { error } = await supabase
          .from("masjid_prayer_times")
          .update(
            field === "start_time"
              ? {
                  start_time: null,
                  asr_start_time_shafi: null,
                  asr_start_time_hanafi: null,
                }
              : { [field]: null }
          )
          .eq("masjid_id", selectedMasjidId)
          .eq("date", selectedDate);

        if (error) {
          console.error(`Error clearing ${field}`, error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          setMessage(`${successLabel} cleared for this day.`);
          setMessageType("success");
          setRows((prev) =>
            prev.map((r) => ({
              ...r,
              [field]: "",
              ...(field === "start_time"
                ? {
                    asr_start_time_shafi: "",
                    asr_start_time_hanafi: "",
                  }
                : {}),
            }))
          );
          setDirty(false);
          setLastSavedAt(
            new Date().toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } else {
        const { error } = await supabase
          .from("masjid_prayer_times")
          .upsert(toSave, {
            onConflict: "masjid_id,date,prayer",
          });

        if (error) {
          console.error(`Error saving ${field}`, error);
          setMessage(error.message);
          setMessageType("error");
        } else {
          await loadPrayerTimes(selectedMasjidId, selectedDate);
          setMessage(`${successLabel} saved for this day.`);
          setMessageType("success");
          setDirty(false);
          setLastSavedAt(
            new Date().toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCityMasjid = (masjidId: string) => {
    setSelectedCityMasjidIds((prev) =>
      prev.includes(masjidId)
        ? prev.filter((id) => id !== masjidId)
        : [...prev, masjidId]
    );
  };

  const handleApplyAdhanToSameCity = async () => {
    if (!selectedDate || selectedCityMasjidIds.length === 0) return;

    const adhanRows = rows.filter(
      (r) =>
        (r.prayer === "asr" &&
          (r.asr_start_time_shafi || r.asr_start_time_hanafi)) ||
        (r.prayer !== "asr" && r.start_time)
    );
    if (adhanRows.length === 0) {
      setMessage("Set at least one adhan start time before applying to a city.");
      setMessageType("error");
      return;
    }

    const payload = selectedCityMasjidIds.flatMap((masjidId) =>
      adhanRows.map((row) => ({
        masjid_id: masjidId,
        date: selectedDate,
        prayer: row.prayer,
        ...(row.prayer === "asr"
          ? buildAsrTimingPayload(row)
          : {
              start_time: `${row.start_time}:00`,
              asr_start_time_shafi: null,
              asr_start_time_hanafi: null,
            }),
      }))
    );

    setApplyingCityAdhan(true);
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase.from("masjid_prayer_times").upsert(
      payload,
      {
        onConflict: "masjid_id,date,prayer",
      }
    );

    setApplyingCityAdhan(false);

    if (error) {
      console.error("Error applying adhan times to same-city masjids", error);
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    setMessage(
      `Adhan times applied to ${selectedCityMasjidIds.length} selected masjid(s) in ${selectedMasjid?.city}.`
    );
    setMessageType("success");
  };

  const handleImportMasjidMwlWeek = async () => {
    if (!selectedDate || !selectedMasjid || !selectedMasjidImportLocation) {
      return;
    }

    if (
      selectedMasjidImportLocation.type === "city" &&
      !selectedMasjidImportLocation.city
    ) {
      setMessage(
        "This masjid needs coordinates or a city before importing adhan times."
      );
      setMessageType("error");
      return;
    }

    const dates = Array.from({ length: WEEK_IMPORT_DAYS }, (_, index) =>
      shiftIsoDate(selectedDate, index)
    );

    setImportingMasjidAdhan(true);
    setMessage(null);
    setMessageType(null);

    try {
      const week = await fetchMasjidMwlWeek(
        dates,
        selectedMasjidImportLocation
      );
      const payload = buildAdhanImportPayload(selectedMasjid.id, week);

      const { error } = await supabase.from("masjid_prayer_times").upsert(
        payload,
        {
          onConflict: "masjid_id,date,prayer",
        }
      );

      if (error) {
        console.error("Error importing masjid MWL adhan week", error);
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      await loadPrayerTimes(selectedMasjid.id, selectedDate);

      setMessage(
        `Imported MWL adhan times for ${selectedMasjid.official_name} (${
          selectedMasjidImportLocation.label
        }) from ${dates[0]} to ${
          dates[dates.length - 1]
        }. Jamaah times were not changed.`
      );
      setMessageType("success");
      setLastSavedAt(
        new Date().toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Error fetching masjid MWL adhan week", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not import adhan times for this masjid."
      );
      setMessageType("error");
    } finally {
      setImportingMasjidAdhan(false);
    }
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Daily prayer times (adhan & jamā‘ah)
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Set official masjid times for Fajr, Dhuhr, Asr, Maghrib and Isha.
            The mobile app will read these as the source of truth.
          </p>
        </div>

        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:w-[560px]">
          <div className="space-y-1.5">
            <span className="font-medium text-slate-600">Masjid</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm"
              value={selectedMasjidId ?? ""}
              onChange={(e) => {
                setSelectedMasjidId(e.target.value || null);
                setMessage(null);
                setMessageType(null);
                setDirty(false);
              }}
              disabled={loadingMasjids}
            >
              {masjids.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.official_name} ({m.city})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-slate-600">Date</span>
            <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] gap-1">
              <button
                type="button"
                onClick={() => handleChangeDateBy(-1)}
                className="rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setMessage(null);
                  setMessageType(null);
                  setDirty(false);
                }}
                className="min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-950 shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleChangeDateBy(1)}
                className="rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="hidden"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {isLimitedPrayerEditor && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Jamaah editor
              </div>
              <div className="mt-1 text-base font-semibold text-slate-950">
                {formatFullDate(selectedDate)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoToday}
              className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Today
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {daySelectorDays.map((day) => {
              const selected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => handleSelectDate(day.date)}
                  className={`rounded-md border px-3 py-2 text-left ${
                    selected
                      ? "border-emerald-500 bg-white text-emerald-900 shadow-sm"
                      : "border-emerald-200 bg-emerald-100/60 text-slate-700 hover:bg-white"
                  }`}
                >
                  <span className="block text-xs font-semibold">
                    {day.compactLabel}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {day.date}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Message + status line */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {message && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs max-w-xl ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {dirty && (
            <span className="inline-flex items-center px-2 py-1 rounded-full border border-amber-400/60 bg-amber-500/10 text-amber-200">
              ● Unsaved changes
            </span>
          )}
          {lastSavedAt && !dirty && (
            <span className="text-slate-500">
              Last saved at{" "}
              <span className="font-medium text-slate-700">
                {lastSavedAt}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 text-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="text-slate-500">
            {selectedMasjid ? (
              <>
                Editing{" "}
                <span className="font-medium text-slate-950">
                  {selectedMasjid.official_name}
                </span>{" "}
                on <span className="text-slate-950">{selectedDate}</span>
              </>
            ) : (
              "Select a masjid to start."
            )}
          </div>
          <div className="grid gap-2 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => void handleImportMasjidMwlWeek()}
              disabled={
                isLimitedPrayerEditor ||
                importingMasjidAdhan ||
                savingAdhan ||
                savingJamaat ||
                applyingCityAdhan ||
                !selectedDate ||
                !selectedMasjid
              }
              title={
                selectedMasjid && selectedMasjidImportLocation
                  ? `Imports ${selectedDate} to ${weeklyImportEndDate} using ${selectedMasjidImportLocation.label}.`
                  : "Select a masjid before importing."
              }
              className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
            >
              {importingMasjidAdhan ? "Importing..." : "Import MWL week"}
            </button>
            <button
              type="button"
              onClick={() => void handleCopyFromPreviousDay("both")}
              disabled={
                isLimitedPrayerEditor ||
                !selectedMasjidId ||
                !selectedDate ||
                loadingPrayers
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Copy from previous day
            </button>
            <button
              type="button"
              onClick={() => void handleCopyFromPreviousDay("jamaat")}
              disabled={!selectedMasjidId || !selectedDate || loadingPrayers}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              Copy jamā‘ah only
            </button>
            <button
              type="button"
              onClick={handleClearAllLocal}
              disabled={
                isLimitedPrayerEditor || !selectedMasjidId || rows.length === 0
              }
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40"
            >
              Clear all (this day)
            </button>
          </div>
        </div>

        {!isLimitedPrayerEditor && selectedMasjid && sameCityMasjids.length > 0 && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-slate-900">
                Apply adhan times to other masjids in {selectedMasjid.city}
              </p>
              <p className="text-[11px] text-slate-500">
                This copies only <span className="text-slate-900">Start (adhan)</span>{" "}
                times for this date. Jamā‘ah times are not changed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {sameCityMasjids.map((masjid) => {
                const checked = selectedCityMasjidIds.includes(masjid.id);
                return (
                  <label
                    key={masjid.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] cursor-pointer ${
                      checked
                        ? "border-sky-400/70 bg-sky-500/15 text-sky-100"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleCityMasjid(masjid.id)}
                      className="accent-sky-500"
                    />
                    {masjid.official_name}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setSelectedCityMasjidIds((prev) =>
                    prev.length === sameCityMasjids.length
                      ? []
                      : sameCityMasjids.map((m) => m.id)
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                {selectedCityMasjidIds.length === sameCityMasjids.length
                  ? "Unselect all"
                  : "Select all"}
              </button>

              <button
                type="button"
                onClick={() => void handleApplyAdhanToSameCity()}
                disabled={
                  applyingCityAdhan ||
                  selectedCityMasjidIds.length === 0 ||
                  !selectedDate
                }
                className="rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                {applyingCityAdhan
                  ? "Applying adhan…"
                  : "Apply adhan to selected masjids"}
              </button>
            </div>
          </div>
        )}

        {isLimitedPrayerEditor && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            This account can edit only jamā‘ah times for this masjid.
          </div>
        )}

        {loadingPrayers ? (
          <div className="text-xs text-slate-400">Loading prayer times…</div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-slate-400">
            No prayers to show. Select a masjid and date.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-5">
            {rows.map((row) => {
              const label = PRAYERS.find((p) => p.key === row.prayer)?.label;
              return (
                <div
                  key={row.prayer}
                  className="flex min-h-40 flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-950">
                      {label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      {row.prayer.toUpperCase()}
                    </span>
                  </div>

                  {row.prayer === "asr" ? (
                    <div className="space-y-2">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-slate-500">
                          Start (adhan) — Shafi
                        </label>
                        <input
                          type="time"
                          value={row.asr_start_time_shafi}
                          onChange={(e) =>
                            updateRow(row.prayer, {
                              asr_start_time_shafi: e.target.value,
                            })
                          }
                          disabled={isLimitedPrayerEditor}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-slate-500">
                          Start (adhan) — Hanafi
                        </label>
                        <input
                          type="time"
                          value={row.asr_start_time_hanafi}
                          onChange={(e) =>
                            updateRow(row.prayer, {
                              asr_start_time_hanafi: e.target.value,
                            })
                          }
                          disabled={isLimitedPrayerEditor}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-slate-500">
                        Start (adhan)
                      </label>
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(e) =>
                          updateRow(row.prayer, { start_time: e.target.value })
                        }
                        disabled={isLimitedPrayerEditor}
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Jamā‘ah (iqamah)
                    </label>
                    <input
                      type="time"
                      value={row.jamaat_time}
                      onChange={(e) =>
                        updateRow(row.prayer, {
                          jamaat_time: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-950"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-2 pt-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() =>
              void handleSave("start_time", setSavingAdhan, "Adhan times")
            }
            disabled={
              isLimitedPrayerEditor ||
              savingAdhan ||
              savingJamaat ||
              !selectedMasjidId
            }
            className="rounded-md bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {savingAdhan ? "Saving…" : "Save adhan times"}
          </button>
          <button
            type="button"
            onClick={() =>
              void handleSave("jamaat_time", setSavingJamaat, "Jamā‘ah times")
            }
            disabled={savingAdhan || savingJamaat || !selectedMasjidId}
            className="rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {savingJamaat ? "Saving…" : "Save jamā‘ah times"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesPage;
