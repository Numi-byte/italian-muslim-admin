// src/pages/AnalyticsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
// ⬇️ adjust this to your existing Supabase client path
import { supabase } from "../lib/supabaseClient"; // e.g. "../supabaseClient"

/* =========================
   Types (match SQL views)
   ========================= */

type Overview = {
  total_profiles: number;
  masjid_count: number;
  push_opt_in_count: number;
  marketing_opt_in_count: number;
};

type MasjidRow = {
  masjid_id: string | null;
  masjid_name: string | null;
  city: string | null;
  profile_count: number;
};

type RoleRow = {
  user_role: string;
  profile_count: number;
};

type AgeRow = {
  age_band: string;
  profile_count: number;
};

type LangRow = {
  app_language: string;
  profile_count: number;
};

/* =========================
   Screen
   ========================= */

const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [byMasjid, setByMasjid] = useState<MasjidRow[]>([]);
  const [byRole, setByRole] = useState<RoleRow[]>([]);
  const [byAge, setByAge] = useState<AgeRow[]>([]);
  const [byLang, setByLang] = useState<LangRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [
        { data: overviewData, error: e1 },
        { data: masjidData, error: e2 },
        { data: roleData, error: e3 },
        { data: ageData, error: e4 },
        { data: langData, error: e5 },
      ] = await Promise.all([
        supabase
          .from("im_analytics_overview")
          .select("*")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("im_analytics_by_masjid")
          .select("*")
          .order("profile_count", { ascending: false }),
        supabase
          .from("im_analytics_by_role")
          .select("*")
          .order("profile_count", { ascending: false }),
        supabase
          .from("im_analytics_by_age_band")
          .select("*")
          .order("age_band", { ascending: true }),
        supabase
          .from("im_analytics_by_app_language")
          .select("*")
          .order("profile_count", { ascending: false }),
      ]);

      if (e1 || e2 || e3 || e4 || e5) {
        console.error("Error loading analytics", e1 || e2 || e3 || e4 || e5);
        setError("Could not load analytics. Please check Supabase logs.");
      } else {
        if (overviewData) setOverview(overviewData as Overview);
        setByMasjid((masjidData ?? []) as MasjidRow[]);
        setByRole((roleData ?? []) as RoleRow[]);
        setByAge((ageData ?? []) as AgeRow[]);
        setByLang((langData ?? []) as LangRow[]);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const totalProfiles = overview?.total_profiles ?? 0;

  const masjidTop5 = useMemo(
    () => byMasjid.slice(0, 5),
    [byMasjid]
  );

  const maxMasjidProfiles = useMemo(
    () =>
      masjidTop5.length
        ? Math.max(...masjidTop5.map((m) => m.profile_count))
        : 0,
    [masjidTop5]
  );

  const maxAgeProfiles = useMemo(
    () =>
      byAge.length ? Math.max(...byAge.map((a) => a.profile_count)) : 0,
    [byAge]
  );

  const maxLangProfiles = useMemo(
    () =>
      byLang.length ? Math.max(...byLang.map((l) => l.profile_count)) : 0,
    [byLang]
  );

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading user analytics…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-100">
        {error}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 text-xs text-slate-300">
        No onboarding profiles found yet. Data will appear as soon as users
        complete onboarding in the mobile app.
      </div>
    );
  }

  const pushPct =
    totalProfiles > 0
      ? Math.round((overview.push_opt_in_count / totalProfiles) * 100)
      : 0;
  const marketingPct =
    totalProfiles > 0
      ? Math.round((overview.marketing_opt_in_count / totalProfiles) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total onboarded profiles"
          value={overview.total_profiles}
          hint="Each install that finished onboarding"
        />
        <KpiCard
          label="Masjids with users"
          value={overview.masjid_count}
          hint="Primary masjid chosen at least once"
        />
        <KpiCard
          label="Push notifications opt-in"
          value={overview.push_opt_in_count}
          secondary={
            totalProfiles ? `${pushPct}% of onboarded users` : undefined
          }
        />
        <KpiCard
          label="Marketing opt-in"
          value={overview.marketing_opt_in_count}
          secondary={
            totalProfiles ? `${marketingPct}% of onboarded users` : undefined
          }
        />
      </div>

      {/* Row 2: by masjid / by role */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Masjids */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Users by masjid
              </h2>
              <p className="text-[11px] text-slate-400">
                Top 5 primary masjids (from onboarding).
              </p>
            </div>
          </div>

          {masjidTop5.length === 0 ? (
            <p className="text-xs text-slate-400">No masjid selections yet.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {masjidTop5.map((m) => {
                const pct =
                  maxMasjidProfiles > 0
                    ? Math.round((m.profile_count / maxMasjidProfiles) * 100)
                    : 0;
                const share =
                  totalProfiles > 0
                    ? Math.round((m.profile_count / totalProfiles) * 100)
                    : 0;

                return (
                  <div key={m.masjid_id ?? m.masjid_name ?? "unknown"}>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">
                          {m.masjid_name ?? "Unknown masjid"}
                        </span>
                        <span className="text-slate-400">
                          {m.city ?? "—"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-100 font-semibold">
                          {m.profile_count}
                        </span>
                        {totalProfiles > 0 && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({share}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400/80"
                        style={{ width: `${pct || 4}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Users by role
              </h2>
              <p className="text-[11px] text-slate-400">
                Self-declared role (attendee, imam, committee, just exploring…).
              </p>
            </div>
          </div>

          {byRole.length === 0 ? (
            <p className="text-xs text-slate-400">
              No role information available yet.
            </p>
          ) : (
            <div className="space-y-2 mt-2">
              {byRole.map((r) => {
                const share =
                  totalProfiles > 0
                    ? Math.round((r.profile_count / totalProfiles) * 100)
                    : 0;

                return (
                  <div
                    key={r.user_role}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-100 capitalize">
                      {r.user_role}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {r.profile_count}
                      {totalProfiles > 0 && (
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({share}%)
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: age + language */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Age bands */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Age distribution
              </h2>
              <p className="text-[11px] text-slate-400">
                Age bands chosen during onboarding.
              </p>
            </div>
          </div>

          {byAge.length === 0 ? (
            <p className="text-xs text-slate-400">
              No age data available yet.
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {byAge.map((a) => {
                const pct =
                  maxAgeProfiles > 0
                    ? Math.round((a.profile_count / maxAgeProfiles) * 100)
                    : 0;
                const share =
                  totalProfiles > 0
                    ? Math.round((a.profile_count / totalProfiles) * 100)
                    : 0;

                return (
                  <div key={a.age_band}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-100">{a.age_band}</span>
                      <span className="text-slate-300 font-medium">
                        {a.profile_count}
                        {totalProfiles > 0 && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({share}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400/80"
                        style={{ width: `${pct || 4}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* App languages */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                App language
              </h2>
              <p className="text-[11px] text-slate-400">
                Chosen interface language (not device locale).
              </p>
            </div>
          </div>

          {byLang.length === 0 ? (
            <p className="text-xs text-slate-400">
              No language data available yet.
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {byLang.map((l) => {
                const pct =
                  maxLangProfiles > 0
                    ? Math.round((l.profile_count / maxLangProfiles) * 100)
                    : 0;
                const share =
                  totalProfiles > 0
                    ? Math.round((l.profile_count / totalProfiles) * 100)
                    : 0;

                return (
                  <div key={l.app_language}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-100 uppercase">
                        {l.app_language}
                      </span>
                      <span className="text-slate-300 font-medium">
                        {l.profile_count}
                        {totalProfiles > 0 && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({share}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400/80"
                        style={{ width: `${pct || 4}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

/* =========================
   KPI card component
   ========================= */

type KpiProps = {
  label: string;
  value: number;
  hint?: string;
  secondary?: string;
};

const KpiCard: React.FC<KpiProps> = ({ label, value, hint, secondary }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 flex flex-col justify-between">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className="mt-1 text-xl font-semibold text-slate-50">
      {value.toLocaleString("it-IT")}
    </div>
    {secondary && (
      <div className="mt-0.5 text-[10px] text-emerald-300">{secondary}</div>
    )}
    {hint && (
      <div className="mt-1 text-[10px] text-slate-500">{hint}</div>
    )}
  </div>
);
