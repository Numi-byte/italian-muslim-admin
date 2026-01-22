// src/pages/RamadanPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // ✅ match PrayerTimesPage

// ✅ Same as PrayerTimesPage dropdown source
type Masjid = {
  id: string;
  official_name: string;
  city: string;
};

type SettingsRow = {
  masjid_id: string;
  enabled: boolean;
  start_date: string; // YYYY-MM-DD (date)
  end_date: string; // YYYY-MM-DD (date)
  taraweeh_start_time: string | null; // HH:MM:SS (time)
  taraweeh_rakaah: number | null;
};

type DayRow = {
  id: number;
  masjid_id: string;
  date: string; // YYYY-MM-DD (date)
  suhoor_end_time: string | null; // HH:MM:SS (time)
  iftar_time: string | null; // HH:MM:SS (time)
};

function todayRomeIso(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addDaysIso(dateIso: string, deltaDays: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function isoRangeInclusive(startIso: string, endIso: string): string[] {
  if (!startIso || !endIso) return [];
  if (endIso < startIso) return [];
  const out: string[] = [];
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDaysIso(cur, 1);
  }
  return out;
}

function timeToInputHHMM(v: string | null): string {
  if (!v) return "";
  const [hh, mm] = v.split(":");
  if (!hh || !mm) return "";
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
}

function inputHHMMToDbTime(v: string): string | null {
  if (!v) return null;
  return `${v}:00`;
}

function clampInt(v: string, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < min || r > max) return null;
  return r;
}

export default function RamadanPage() {
  const [loading, setLoading] = useState(true);

  // ✅ dropdown
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [masjidId, setMasjidId] = useState<string>("");

  // Settings (form state)
  const [enabled, setEnabled] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [taraweehTime, setTaraweehTime] = useState<string>(""); // input HH:MM
  const [taraweehRakaah, setTaraweehRakaah] = useState<string>(""); // input string

  // Daily rows (date -> values)
  const [daysMap, setDaysMap] = useState<Record<string, { suhoor: string; iftar: string }>>({});

  // Status UI
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const initialSnapshotRef = useRef<string>("");

  const todayIso = useMemo(() => todayRomeIso(), []);
  const daysInRange = useMemo(() => isoRangeInclusive(startDate, endDate), [startDate, endDate]);

  const dirty = useMemo(() => {
    const snapshot = JSON.stringify({
      masjidId,
      enabled,
      startDate,
      endDate,
      taraweehTime,
      taraweehRakaah,
      daysMap,
    });
    return snapshot !== initialSnapshotRef.current;
  }, [masjidId, enabled, startDate, endDate, taraweehTime, taraweehRakaah, daysMap]);

  // ---------------------------------------------------------------------------
  // 1) Load masjids for dropdown (✅ same as PrayerTimesPage)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function loadMasjids() {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("public_masjids")
          .select("id, official_name, city")
          .order("city", { ascending: true })
          .order("official_name", { ascending: true });

        if (error) throw error;

        const list = (data ?? []) as Masjid[];
        if (!mounted) return;

        setMasjids(list);

        // default selection
        if (list.length > 0) {
          setMasjidId((prev) => prev || list[0].id);
        } else {
          setMasjidId("");
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setError((e instanceof Error ? e.message : String(e)) ?? "Could not load masjids.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadMasjids();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2) When masjid changes: load settings + days
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    if (!masjidId) return;

    async function loadAll() {
      setError("");
      setStatus("");
      setSaving(false);

      try {
        // Settings (maybeSingle)
        const { data: s, error: sErr } = await supabase
          .from("masjid_ramadhan_settings")
          .select("masjid_id,enabled,start_date,end_date,taraweeh_start_time,taraweeh_rakaah")
          .eq("masjid_id", masjidId)
          .maybeSingle();

        if (sErr) throw sErr;

        const settings = (s as SettingsRow | null) ?? null;
        const defaultStart = settings?.start_date ?? "";
        const defaultEnd = settings?.end_date ?? "";

        if (!mounted) return;

        setEnabled(settings?.enabled ?? false);
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        setTaraweehTime(timeToInputHHMM(settings?.taraweeh_start_time ?? null));
        setTaraweehRakaah(settings?.taraweeh_rakaah != null ? String(settings.taraweeh_rakaah) : "");

        // Days (if range exists -> range query, else load any existing to not lose data)
        let daysRows: DayRow[] = [];

        if (settings?.start_date && settings?.end_date) {
          const { data: d, error: dErr } = await supabase
            .from("masjid_ramadhan_days")
            .select("id,masjid_id,date,suhoor_end_time,iftar_time")
            .eq("masjid_id", masjidId)
            .gte("date", settings.start_date)
            .lte("date", settings.end_date)
            .order("date", { ascending: true });

          if (dErr) throw dErr;
          daysRows = (d ?? []) as DayRow[];
        } else {
          const { data: d, error: dErr } = await supabase
            .from("masjid_ramadhan_days")
            .select("id,masjid_id,date,suhoor_end_time,iftar_time")
            .eq("masjid_id", masjidId)
            .order("date", { ascending: true })
            .limit(120);

          if (dErr) throw dErr;
          daysRows = (d ?? []) as DayRow[];
        }

        if (!mounted) return;

        const m: Record<string, { suhoor: string; iftar: string }> = {};
        for (const r of daysRows) {
          m[r.date] = {
            suhoor: timeToInputHHMM(r.suhoor_end_time),
            iftar: timeToInputHHMM(r.iftar_time),
          };
        }
        setDaysMap(m);

        // snapshot after load
        initialSnapshotRef.current = JSON.stringify({
          masjidId,
          enabled: settings?.enabled ?? false,
          startDate: defaultStart,
          endDate: defaultEnd,
          taraweehTime: timeToInputHHMM(settings?.taraweeh_start_time ?? null),
          taraweehRakaah: settings?.taraweeh_rakaah != null ? String(settings.taraweeh_rakaah) : "",
          daysMap: m,
        });
      } catch (e: unknown) {
        if (!mounted) return;
        setError((e instanceof Error ? e.message : String(e)) ?? "Could not load Ramadhan settings.");
      }
    }

    void loadAll();
    return () => {
      mounted = false;
    };
  }, [masjidId]);

  // ---------------------------------------------------------------------------
  // 3) When range changes, ensure daysMap has keys for each date
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (endDate < startDate) return;

    setDaysMap((prev) => {
      const next = { ...prev };
      for (const d of daysInRange) {
        if (!next[d]) next[d] = { suhoor: "", iftar: "" };
      }
      // remove out of range
      for (const k of Object.keys(next)) {
        if (k < startDate || k > endDate) delete next[k];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const selectedMasjid = useMemo(
    () => masjids.find((m) => m.id === masjidId) ?? null,
    [masjids, masjidId]
  );

  function updateDay(dateIso: string, key: "suhoor" | "iftar", value: string) {
    setDaysMap((prev) => ({
      ...prev,
      [dateIso]: { ...(prev[dateIso] ?? { suhoor: "", iftar: "" }), [key]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setStatus("");

    try {
      if (!masjidId) throw new Error("Select a masjid first.");
      if (!startDate || !endDate) throw new Error("Please set start and end dates.");
      if (endDate < startDate) throw new Error("End date must be after start date.");

      const rakaah = taraweehRakaah ? clampInt(taraweehRakaah, 2, 60) : null;
      if (taraweehRakaah && rakaah == null) {
        throw new Error("Taraweeh rakaʿah must be a number between 2 and 60.");
      }

      // 1) Upsert settings (masjid_id PK)
      const settingsPayload: Partial<SettingsRow> & { masjid_id: string } = {
        masjid_id: masjidId,
        enabled,
        start_date: startDate,
        end_date: endDate,
        taraweeh_start_time: inputHHMMToDbTime(taraweehTime),
        taraweeh_rakaah: rakaah,
      };

      const { error: upErr } = await supabase
        .from("masjid_ramadhan_settings")
        .upsert(settingsPayload, { onConflict: "masjid_id" });

      if (upErr) throw upErr;

      // 2) Upsert day rows (unique masjid_id+date)
      const rows = daysInRange.map((d) => {
        const val = daysMap[d] ?? { suhoor: "", iftar: "" };
        return {
          masjid_id: masjidId,
          date: d,
          suhoor_end_time: inputHHMMToDbTime(val.suhoor),
          iftar_time: inputHHMMToDbTime(val.iftar),
        };
      });

      const { error: daysErr } = await supabase
        .from("masjid_ramadhan_days")
        .upsert(rows, { onConflict: "masjid_id,date" });

      if (daysErr) throw daysErr;

      setStatus("Saved.");

      initialSnapshotRef.current = JSON.stringify({
        masjidId,
        enabled,
        startDate,
        endDate,
        taraweehTime,
        taraweehRakaah,
        daysMap,
      });
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) ?? "Save failed.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setStatus(""), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-300">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading Ramadhan setup…</span>
        </div>
      </div>
    );
  }

  if (!masjids.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-xs text-slate-300">
        No masjids found in <span className="font-mono">public_masjids</span>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="text-xs text-slate-400">
            Today (Europe/Rome): <span className="text-slate-200 font-mono">{todayIso}</span>
          </div>
          <div className="text-xs text-slate-400">
            Selected masjid:{" "}
            <span className="text-slate-200 font-medium">
              {selectedMasjid?.official_name ?? "—"}
            </span>
            {selectedMasjid?.city ? <span className="text-slate-500"> · {selectedMasjid.city}</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-200">
              Unsaved changes
            </span>
          )}
          {status && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
              {status}
            </span>
          )}
          {error && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-200">
              {error}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`rounded-lg px-3 py-2 text-[11px] font-semibold border ${
              saving || !dirty
                ? "border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed"
                : "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
            }`}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Masjid selector + settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-sm font-semibold">Masjid</div>
          <p className="mt-1 text-xs text-slate-400">
            Choose the masjid you want to configure for Ramadhan.
          </p>

          <label className="mt-3 block text-[11px] text-slate-400">Masjid</label>
          <select
            value={masjidId}
            onChange={(e) => setMasjidId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {masjids.map((m) => (
              <option key={m.id} value={m.id}>
                {m.official_name} ({m.city})
              </option>
            ))}
          </select>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
            <div>
              <div className="text-[12px] font-medium text-slate-100">Enable Ramadhan tab</div>
              <div className="text-[11px] text-slate-500">
                Mobile shows the Ramadhan tab only inside the date window.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((v) => !v)}
              className={`h-8 w-14 rounded-full border transition ${
                enabled
                  ? "border-emerald-500/50 bg-emerald-500/30"
                  : "border-slate-700 bg-slate-900"
              }`}
              aria-label="Toggle Ramadhan"
            >
              <div
                className={`h-6 w-6 rounded-full bg-slate-50 transition-transform ${
                  enabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div>
            <div className="text-sm font-semibold">Season settings</div>
            <p className="mt-1 text-xs text-slate-400">
              Set the date window (Europe/Rome) and optional Taraweeh defaults.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              {startDate && endDate && endDate < startDate && (
                <div className="mt-1 text-[11px] text-rose-300">
                  End date must be after start date.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-[11px] text-slate-400">Days in range</div>
              <div className="mt-1 text-xl font-black text-slate-100">
                {daysInRange.length || "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400">Taraweeh start (optional)</label>
              <input
                type="time"
                value={taraweehTime}
                onChange={(e) => setTaraweehTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400">Taraweeh rakaʿah (optional)</label>
              <input
                type="number"
                min={2}
                max={60}
                value={taraweehRakaah}
                onChange={(e) => setTaraweehRakaah(e.target.value)}
                placeholder="8 or 20"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Mobile rule: tab shows only if{" "}
            <span className="font-mono text-slate-200">enabled</span> and{" "}
            <span className="font-mono text-slate-200">today ∈ [start_date, end_date]</span>.
          </div>
        </div>
      </div>

      {/* Daily table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div>
          <div className="text-sm font-semibold">Daily timetable</div>
          <p className="mt-1 text-xs text-slate-400">
            Edit Suhoor end and Iftar time for each day. (Safe to upsert.)
          </p>
        </div>

        {!startDate || !endDate ? (
          <div className="mt-4 text-xs text-slate-400">
            Set a start and end date to generate the daily table.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Day #</th>
                  <th className="py-2 pr-3">Suhoor ends</th>
                  <th className="py-2 pr-3">Iftar</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {daysInRange.map((d, idx) => {
                  const row = daysMap[d] ?? { suhoor: "", iftar: "" };
                  const isToday = d === todayIso;
                  const filled = !!row.suhoor && !!row.iftar;

                  return (
                    <tr key={d} className="border-b border-slate-900/60">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-slate-200">{d}</span>
                          {isToday && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                              Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="time"
                          value={row.suhoor}
                          onChange={(e) => updateDay(d, "suhoor", e.target.value)}
                          className="w-36 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="time"
                          value={row.iftar}
                          onChange={(e) => updateDay(d, "iftar", e.target.value)}
                          className="w-36 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        {filled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-400">
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
