import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabaseClient";
import { Alert, Button, LoadingBlock } from "../components/ui";

// -------------------------------------------------------------
// Types (mirror of /api/analytics payload)
// -------------------------------------------------------------

type SortDirection = "asc" | "desc";

type Overview = {
  total_downloaded_installations: number | null;
  installed_now: number | null;
  inferred_uninstalled: number | null;
  active_installations_24h: number | null;
  active_signed_masjid_users_24h: number | null;
  sessions_today: number | null;
  avg_session_seconds_today: number | null;
  generated_at: string | null;
};

type MasjidActiveUsersRow = {
  current_masjid_id?: string | null;
  masjid_name: string | null;
  city: string | null;
  active_signed_users_24h: number | null;
  active_signed_users_7d: number | null;
  active_installations_7d: number | null;
};

type PageTimeRow = {
  page_path: string | null;
  views: number | null;
  unique_installations: number | null;
  total_seconds: number | null;
  avg_seconds: number | null;
  last_viewed_at: string | null;
};

type RetentionRow = {
  install_date: string | null;
  downloaded_installations: number | null;
  retained_day_1: number | null;
  retained_day_7: number | null;
  retained_day_30: number | null;
  inferred_uninstalled: number | null;
  average_days_installed: number | null;
};

type FrequencyRow = {
  date: string | null;
  app_opens: number | null;
  active_installations: number | null;
  opens_per_active_installation: number | null;
  average_session_seconds: number | null;
};

type AudienceOverview = {
  total_profiles: number | null;
  masjid_count: number | null;
  push_opt_in_count: number | null;
  marketing_opt_in_count: number | null;
};

type LabelCount = { label: string; count: number };

type Audience = {
  overview: AudienceOverview | null;
  byAgeBand: Array<{ age_band: string | null; profile_count: number | null }>;
  byLanguage: Array<{
    app_language: string | null;
    profile_count: number | null;
  }>;
  byRole: Array<{ user_role: string | null; profile_count: number | null }>;
  byMasjid: Array<{
    masjid_id: string | null;
    masjid_name: string | null;
    city: string | null;
    profile_count: number | null;
  }>;
  byGender: LabelCount[];
  totalProfiles: number;
  registeredProfiles: number;
  guestProfiles: number;
  upgradedFromGuest: number;
};

type PlatformCount = {
  label: string;
  installations: number;
  installedNow: number;
};

type Devices = {
  byPlatform: PlatformCount[];
  byVersion: PlatformCount[];
};

type Engagement = {
  masjidFollowers: number | null;
  salahLogsTotal: number | null;
  salahLogs7d: number | null;
  duaJournalEntries: number | null;
  duaFavorites: number | null;
  foundingWallEntries: number | null;
  foundingSupporters: number;
  lifetimePremium: number;
};

type AnalyticsPayload = {
  overview: Overview | null;
  masjidActiveUsers: MasjidActiveUsersRow[];
  pageTime: PageTimeRow[];
  retention: RetentionRow[];
  dailyFrequency: FrequencyRow[];
  audience?: Audience | null;
  devices?: Devices | null;
  engagement?: Engagement | null;
};

// -------------------------------------------------------------
// Constants
// -------------------------------------------------------------

type DateRangeKey = "7d" | "30d" | "90d" | "all";

const dateRangeOptions: Array<{ label: string; value: DateRangeKey }> = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

type TabKey = "overview" | "audience" | "devices" | "masjids" | "screens";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "audience", label: "Audience" },
  { key: "devices", label: "Devices" },
  { key: "masjids", label: "Masjids" },
  { key: "screens", label: "Screens" },
];

// Chart palette — validated against the white card surface
// (categorical pair, ordinal blue ramp, single-hue emerald accent).
const SERIES_BLUE = "#2a78d6";
const SERIES_ORANGE = "#eb6834";
const SERIES_AQUA = "#1baf7a";
const SERIES_YELLOW = "#eda100";
const ACCENT_EMERALD = "#059669";
const ORDINAL_BLUES = ["#86b6ef", "#2a78d6", "#104281"];
const CATEGORICAL = [SERIES_BLUE, SERIES_ORANGE, SERIES_AQUA, SERIES_YELLOW];

const numberFormatter = new Intl.NumberFormat("it-IT");

const LANGUAGE_LABELS: Record<string, string> = {
  it: "Italiano",
  en: "English",
  ar: "Arabic (العربية)",
  ur: "Urdu (اردو)",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  tr: "Türkçe",
  bn: "Bangla (বাংলা)",
  sq: "Shqip",
};

const PLATFORM_LABELS: Record<string, string> = {
  android: "Android",
  ios: "iOS",
  web: "Web",
};

// -------------------------------------------------------------
// Page
// -------------------------------------------------------------

const AnalyticsPage: React.FC = () => {
  const { session, isAdmin } = useAuth();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const [tab, setTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");

  const fetchAnalytics = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      const accessToken = await getCurrentAccessToken();

      if (!accessToken) {
        setLoading(false);
        setError("Sign in as an admin to view analytics.");
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        let response = await requestAnalytics(accessToken);

        if (response.status === 401) {
          const refreshedToken = await refreshAccessToken();
          if (refreshedToken && refreshedToken !== accessToken) {
            response = await requestAnalytics(refreshedToken);
          }
        }

        await assertJsonResponse(response);

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Could not load analytics.");
        }

        const payload = (await response.json()) as AnalyticsPayload;
        setData(payload);
        setError(null);
      } catch (loadError) {
        console.error("[Analytics] load failed", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load analytics."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchAnalytics("initial");
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!session?.access_token) return;

    const watchedTables = [
      "app_installations",
      "app_sessions",
      "app_page_views",
      "im_user_profiles",
    ];

    let channel = supabase.channel("analytics-dashboard-live");
    for (const table of watchedTables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => void fetchAnalytics()
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setLiveStatus("live");
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setLiveStatus("offline");
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAnalytics, session?.access_token]);

  const overview = data?.overview;
  const audience = data?.audience ?? null;
  const devices = data?.devices ?? null;
  const engagement = data?.engagement ?? null;

  const filteredRetention = useMemo(
    () => filterByDateRange(data?.retention ?? [], "install_date", dateRange),
    [data?.retention, dateRange]
  );

  const filteredFrequency = useMemo(
    () => filterByDateRange(data?.dailyFrequency ?? [], "date", dateRange),
    [data?.dailyFrequency, dateRange]
  );

  if (!isAdmin) {
    return (
      <Alert tone="error">
        User statistics are restricted to the super admin account.
      </Alert>
    );
  }

  if (loading) {
    return <LoadingBlock label="Loading live analytics…" />;
  }

  const hasAnyData =
    Boolean(overview) ||
    Boolean(data?.masjidActiveUsers.length) ||
    Boolean(data?.pageTime.length) ||
    Boolean(data?.retention.length) ||
    Boolean(data?.dailyFrequency.length) ||
    Boolean(audience?.totalProfiles);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  User statistics
                </h2>
                <LiveBadge status={liveStatus} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Everything the app collects, aggregated server-side. Super
                admin only — no personal data is shown.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {overview?.generated_at && (
                <span className="text-[11px] text-slate-400">
                  Updated {formatDateTime(overview.generated_at)}
                </span>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void fetchAnalytics()}
                disabled={refreshing}
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  tab === item.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {!hasAnyData && !error && (
        <EmptyPanel title="No analytics yet">
          App installs, sessions, profiles and page views will appear here as
          soon as the mobile app starts writing analytics events.
        </EmptyPanel>
      )}

      {tab === "overview" && (
        <OverviewTab
          overview={overview}
          audience={audience}
          engagement={engagement}
          frequency={filteredFrequency}
          retention={filteredRetention}
          dateRange={dateRange}
          onDateRange={setDateRange}
        />
      )}
      {tab === "audience" && <AudienceTab audience={audience} />}
      {tab === "devices" && (
        <DevicesTab devices={devices} overview={overview} />
      )}
      {tab === "masjids" && (
        <MasjidsTab
          activeUsers={data?.masjidActiveUsers ?? []}
          audience={audience}
        />
      )}
      {tab === "screens" && <ScreensTab pageTime={data?.pageTime ?? []} />}
    </div>
  );
};

export default AnalyticsPage;

// -------------------------------------------------------------
// Overview tab
// -------------------------------------------------------------

const OverviewTab: React.FC<{
  overview: Overview | null | undefined;
  audience: Audience | null;
  engagement: Engagement | null;
  frequency: FrequencyRow[];
  retention: RetentionRow[];
  dateRange: DateRangeKey;
  onDateRange: (value: DateRangeKey) => void;
}> = ({
  overview,
  audience,
  engagement,
  frequency,
  retention,
  dateRange,
  onDateRange,
}) => {
  const totalProfiles =
    audience?.overview?.total_profiles ?? audience?.totalProfiles ?? null;
  const pushOptIn = audience?.overview?.push_opt_in_count ?? null;
  const marketingOptIn = audience?.overview?.marketing_opt_in_count ?? null;

  const openPoints: TrendPoint[] = frequency.map((row) => ({
    x: row.date ?? "",
    values: [row.app_opens, row.active_installations],
  }));

  const sessionPoints: TrendPoint[] = frequency.map((row) => ({
    x: row.date ?? "",
    values: [row.average_session_seconds],
  }));

  return (
    <div className="space-y-5">
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Community profiles"
          value={totalProfiles}
          detail="Everyone who opened the app and got a profile"
          emphasis
        />
        <StatTile
          label="Installed devices"
          value={overview?.installed_now}
          detail={`${formatNumber(
            overview?.total_downloaded_installations
          )} downloads all-time · ${formatNumber(
            overview?.inferred_uninstalled
          )} uninstalled`}
          emphasis
        />
        <StatTile
          label="Active devices · 24h"
          value={overview?.active_installations_24h}
          detail={`${formatNumber(
            overview?.active_signed_masjid_users_24h
          )} signed in with a masjid`}
          emphasis
        />
        <StatTile
          label="Sessions today"
          value={overview?.sessions_today}
          detail={`Average length ${formatDuration(
            overview?.avg_session_seconds_today
          )}`}
          emphasis
        />
      </div>

      {/* Notifications & engagement strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Push opt-in"
          value={formatShare(pushOptIn, totalProfiles)}
          detail={`${formatNumber(pushOptIn)} of ${formatNumber(
            totalProfiles
          )} profiles`}
        />
        <StatTile
          label="Marketing opt-in"
          value={formatShare(marketingOptIn, totalProfiles)}
          detail={`${formatNumber(marketingOptIn)} profiles`}
        />
        <StatTile
          label="Masjid followers"
          value={engagement?.masjidFollowers}
          detail="Users following at least one masjid"
        />
        <StatTile
          label="Salah logs · 7d"
          value={engagement?.salahLogs7d}
          detail={`${formatNumber(engagement?.salahLogsTotal)} logged all-time`}
        />
        <StatTile
          label="Dua journal"
          value={engagement?.duaJournalEntries}
          detail={`${formatNumber(engagement?.duaFavorites)} dua favorites`}
        />
        <StatTile
          label="Supporters"
          value={
            engagement
              ? engagement.foundingSupporters + engagement.lifetimePremium
              : null
          }
          detail={`${formatNumber(
            engagement?.foundingSupporters
          )} founding · ${formatNumber(
            engagement?.lifetimePremium
          )} lifetime · ${formatNumber(
            engagement?.foundingWallEntries
          )} on the wall`}
        />
      </div>

      {/* Trends */}
      <Panel
        title="Daily usage"
        subtitle="App opens and distinct active devices per day."
        actions={<RangePills value={dateRange} onChange={onDateRange} />}
      >
        {openPoints.length ? (
          <TrendChart
            points={openPoints}
            series={[
              { label: "App opens", color: SERIES_BLUE },
              { label: "Active devices", color: SERIES_ORANGE },
            ]}
          />
        ) : (
          <ChartEmptyState label="No usage recorded in this range." />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Panel
          title="Average session length"
          subtitle="Mean seconds per session, per day."
        >
          {sessionPoints.length ? (
            <TrendChart
              points={sessionPoints}
              series={[{ label: "Avg session", color: ACCENT_EMERALD }]}
              valueFormatter={formatDuration}
              area
            />
          ) : (
            <ChartEmptyState label="No sessions recorded in this range." />
          )}
        </Panel>

        <Panel
          title="Retention"
          subtitle="Of the people who installed on a given day, how many were still using the app 1, 7 and 30 days later."
        >
          {retention.length ? (
            <RetentionSection rows={retention} />
          ) : (
            <ChartEmptyState label="No install cohorts in this range." />
          )}
        </Panel>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Audience tab
// -------------------------------------------------------------

const AudienceTab: React.FC<{ audience: Audience | null }> = ({
  audience,
}) => {
  if (!audience || !audience.totalProfiles) {
    return (
      <EmptyPanel title="No audience data yet">
        Audience demographics appear once user profiles are created in the app.
        If you just deployed the new analytics API, redeploy the server so this
        section is included in the response.
      </EmptyPanel>
    );
  }

  const total = audience.totalProfiles;

  const languageItems = audience.byLanguage.map((row) => ({
    label:
      LANGUAGE_LABELS[row.app_language ?? ""] ??
      row.app_language ??
      "Not set",
    count: row.profile_count ?? 0,
  }));

  const ageItems = [...audience.byAgeBand]
    .map((row) => ({
      label: formatAgeBand(row.age_band),
      count: row.profile_count ?? 0,
      sortKey: ageBandSortKey(row.age_band),
    }))
    .sort((a, b) => a.sortKey - b.sortKey);

  const roleItems = audience.byRole.map((row) => ({
    label: humanize(row.user_role),
    count: row.profile_count ?? 0,
  }));

  const genderItems = audience.byGender.map((row) => ({
    label: humanize(row.label),
    count: row.count,
  }));

  const accountSegments = [
    {
      label: "Signed-in accounts",
      count: audience.registeredProfiles,
      color: SERIES_BLUE,
    },
    {
      label: "Guest profiles",
      count: audience.guestProfiles,
      color: SERIES_ORANGE,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Total profiles"
          value={total}
          detail="Guests and signed-in accounts"
          emphasis
        />
        <StatTile
          label="Signed-in accounts"
          value={audience.registeredProfiles}
          detail={`${formatShare(
            audience.registeredProfiles,
            total
          )} of all profiles`}
          emphasis
        />
        <StatTile
          label="Upgraded from guest"
          value={audience.upgradedFromGuest}
          detail="Guests who later created an account"
          emphasis
        />
        <StatTile
          label="Masjids represented"
          value={audience.overview?.masjid_count}
          detail="Masjids selected as primary by at least one profile"
          emphasis
        />
      </div>

      <Panel
        title="Guest vs signed-in"
        subtitle="How much of the audience has created an account."
      >
        <SplitBar segments={accountSegments} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="App language"
          subtitle="Language each profile uses the app in."
        >
          <BreakdownBars items={languageItems} total={total} />
        </Panel>
        <Panel
          title="Age bands"
          subtitle="Self-declared during onboarding — most users skip it."
        >
          <BreakdownBars items={ageItems} total={total} />
        </Panel>
        <Panel
          title="Gender"
          subtitle="Self-declared and optional, so mostly not provided."
        >
          <BreakdownBars items={genderItems} total={total} />
        </Panel>
        <Panel
          title="Community role"
          subtitle="How users describe themselves (attendee, imam, …)."
        >
          <BreakdownBars items={roleItems} total={total} />
        </Panel>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Devices tab
// -------------------------------------------------------------

const DevicesTab: React.FC<{
  devices: Devices | null;
  overview: Overview | null | undefined;
}> = ({ devices, overview }) => {
  if (!devices || !devices.byPlatform.length) {
    return (
      <EmptyPanel title="No device data yet">
        Platform and version breakdowns appear once installations are recorded.
        If you just deployed the new analytics API, redeploy the server so this
        section is included in the response.
      </EmptyPanel>
    );
  }

  const totalInstallations = devices.byPlatform.reduce(
    (sum, row) => sum + row.installations,
    0
  );

  const platformSegments = devices.byPlatform.map((row, index) => ({
    label: PLATFORM_LABELS[row.label] ?? humanize(row.label),
    count: row.installations,
    color: CATEGORICAL[index % CATEGORICAL.length],
  }));

  const versions = foldTail(devices.byVersion, 8);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Downloads all-time"
          value={overview?.total_downloaded_installations}
          detail="Unique client installations"
          emphasis
        />
        <StatTile
          label="Installed now"
          value={overview?.installed_now}
          detail="Not marked uninstalled"
          emphasis
        />
        <StatTile
          label="Uninstalled (inferred)"
          value={overview?.inferred_uninstalled}
          detail="Push receipts or long inactivity"
          emphasis
        />
        <StatTile
          label="Active devices · 24h"
          value={overview?.active_installations_24h}
          detail="Seen in the last 24 hours"
          emphasis
        />
      </div>

      <Panel
        title="Platform"
        subtitle="All recorded installations by operating system."
      >
        <SplitBar segments={platformSegments} />
      </Panel>

      <Panel
        title="App version adoption"
        subtitle="Which versions installations are on — old versions that never updated show up here."
      >
        <div className="space-y-3">
          {versions.map((row) => {
            const share = totalInstallations
              ? (row.installations / totalInstallations) * 100
              : 0;
            const stillInstalled = row.installations
              ? Math.round((row.installedNow / row.installations) * 100)
              : 0;
            return (
              <div
                key={row.label}
                className="grid grid-cols-[90px_1fr_170px] items-center gap-3 text-xs"
              >
                <div className="font-semibold text-slate-700">
                  {row.label === "unknown" ? "Unknown" : `v${row.label}`}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(share, 1)}%`,
                      backgroundColor: ACCENT_EMERALD,
                    }}
                  />
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {formatNumber(row.installations)} installs ·{" "}
                  {share.toFixed(0)}% · {stillInstalled}% still installed
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

// -------------------------------------------------------------
// Masjids tab
// -------------------------------------------------------------

type MasjidMergedRow = {
  masjid_name: string;
  city: string;
  profiles: number | null;
  active_signed_users_24h: number | null;
  active_signed_users_7d: number | null;
  active_installations_7d: number | null;
  [key: string]: unknown;
};

const MasjidsTab: React.FC<{
  activeUsers: MasjidActiveUsersRow[];
  audience: Audience | null;
}> = ({ activeUsers, audience }) => {
  const [sort, setSort] = useState<{
    key: keyof MasjidMergedRow;
    direction: SortDirection;
  }>({ key: "active_signed_users_7d", direction: "desc" });

  const rows = useMemo(() => {
    const merged = new Map<string, MasjidMergedRow>();

    const keyFor = (id: string | null | undefined, name: string | null) =>
      id ?? name ?? "unknown";

    for (const row of activeUsers) {
      merged.set(keyFor(row.current_masjid_id, row.masjid_name), {
        masjid_name: row.masjid_name ?? "Unknown masjid",
        city: row.city ?? "-",
        profiles: null,
        active_signed_users_24h: row.active_signed_users_24h,
        active_signed_users_7d: row.active_signed_users_7d,
        active_installations_7d: row.active_installations_7d,
      });
    }

    for (const row of audience?.byMasjid ?? []) {
      const key = keyFor(row.masjid_id, row.masjid_name);
      const existing = merged.get(key);
      if (existing) {
        existing.profiles = row.profile_count;
        if (existing.city === "-" && row.city) existing.city = row.city;
      } else {
        merged.set(key, {
          masjid_name: row.masjid_name ?? "Unknown masjid",
          city: row.city ?? "-",
          profiles: row.profile_count,
          active_signed_users_24h: null,
          active_signed_users_7d: null,
          active_installations_7d: null,
        });
      }
    }

    return sortRows(Array.from(merged.values()), sort.key, sort.direction);
  }, [activeUsers, audience?.byMasjid, sort]);

  return (
    <Panel
      title="Masjid community"
      subtitle="Profiles that picked the masjid as primary, plus recent active users. Uninstalled devices are excluded."
    >
      <DataTable
        columns={[
          {
            key: "masjid_name",
            label: "Masjid",
            render: (row) => row.masjid_name,
          },
          { key: "city", label: "City", render: (row) => row.city },
          {
            key: "profiles",
            label: "Profiles",
            align: "right",
            render: (row) => formatNumber(row.profiles),
          },
          {
            key: "active_signed_users_24h",
            label: "Signed users 24h",
            align: "right",
            render: (row) => formatNumber(row.active_signed_users_24h),
          },
          {
            key: "active_signed_users_7d",
            label: "Signed users 7d",
            align: "right",
            render: (row) => formatNumber(row.active_signed_users_7d),
          },
          {
            key: "active_installations_7d",
            label: "Devices 7d",
            align: "right",
            render: (row) => formatNumber(row.active_installations_7d),
          },
        ]}
        rows={rows}
        sortKey={sort.key}
        sortDirection={sort.direction}
        onSort={(key) => setSort((current) => toggleSort(current, key))}
        emptyLabel="No masjid activity yet."
      />
    </Panel>
  );
};

// -------------------------------------------------------------
// Screens tab
// -------------------------------------------------------------

const ScreensTab: React.FC<{ pageTime: PageTimeRow[] }> = ({ pageTime }) => {
  const [sort, setSort] = useState<{
    key: keyof PageTimeRow;
    direction: SortDirection;
  }>({ key: "total_seconds", direction: "desc" });

  const maxSeconds = Math.max(
    1,
    ...pageTime.map((row) => Number(row.total_seconds ?? 0))
  );

  const rows = useMemo(
    () => sortRows(pageTime, sort.key, sort.direction),
    [pageTime, sort]
  );

  return (
    <Panel
      title="Time spent per screen"
      subtitle="Where people actually spend their time inside the app."
    >
      <DataTable
        columns={[
          {
            key: "page_path",
            label: "Screen",
            render: (row) => (
              <div className="flex min-w-[220px] items-center gap-3">
                <span className="w-36 truncate font-medium text-slate-800">
                  {row.page_path ?? "Unknown"}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(
                        (Number(row.total_seconds ?? 0) / maxSeconds) * 100,
                        1
                      )}%`,
                      backgroundColor: ACCENT_EMERALD,
                    }}
                  />
                </span>
              </div>
            ),
          },
          {
            key: "total_seconds",
            label: "Total time",
            align: "right",
            render: (row) => formatDuration(row.total_seconds),
          },
          {
            key: "avg_seconds",
            label: "Avg per view",
            align: "right",
            render: (row) => formatDuration(row.avg_seconds),
          },
          {
            key: "views",
            label: "Views",
            align: "right",
            render: (row) => formatNumber(row.views),
          },
          {
            key: "unique_installations",
            label: "Unique devices",
            align: "right",
            render: (row) => formatNumber(row.unique_installations),
          },
          {
            key: "last_viewed_at",
            label: "Last viewed",
            align: "right",
            render: (row) => formatDateTime(row.last_viewed_at),
          },
        ]}
        rows={rows}
        sortKey={sort.key}
        sortDirection={sort.direction}
        onSort={(key) => setSort((current) => toggleSort(current, key))}
        emptyLabel="No page views have been recorded yet."
      />
    </Panel>
  );
};

// -------------------------------------------------------------
// Shared presentational pieces
// -------------------------------------------------------------

const StatTile: React.FC<{
  label: string;
  value: number | string | null | undefined;
  detail?: string;
  emphasis?: boolean;
}> = ({ label, value, detail, emphasis = false }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div
      className={`mt-2 font-bold text-slate-900 ${
        emphasis ? "text-3xl" : "text-xl"
      }`}
    >
      {typeof value === "string" ? value : formatNumber(value)}
    </div>
    {detail && (
      <div className="mt-1.5 text-[11px] leading-4 text-slate-400">
        {detail}
      </div>
    )}
  </div>
);

const Panel: React.FC<{
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}> = ({ title, subtitle, actions, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
          {subtitle}
        </p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const EmptyPanel: React.FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-xs text-slate-500">{children}</p>
  </div>
);

const ChartEmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center text-xs text-slate-500">
    {label}
  </div>
);

const LiveBadge: React.FC<{ status: "connecting" | "live" | "offline" }> = ({
  status,
}) => {
  const statusClass =
    status === "live"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "connecting"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-800";

  return (
    <span
      className={`inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === "live" ? "Live" : status}
    </span>
  );
};

const RangePills: React.FC<{
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
    {dateRangeOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`rounded-md px-2.5 py-1 transition ${
          value === option.value
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

// -------------------------------------------------------------
// Breakdown bars / split bar
// -------------------------------------------------------------

const BreakdownBars: React.FC<{
  items: Array<{ label: string; count: number }>;
  total: number;
}> = ({ items, total }) => {
  if (!items.length) {
    return <ChartEmptyState label="No data recorded yet." />;
  }

  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[130px_1fr_110px] items-center gap-3 text-xs"
        >
          <div className="truncate font-medium text-slate-700" title={item.label}>
            {item.label}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.count / max) * 100, 1)}%`,
                backgroundColor: ACCENT_EMERALD,
              }}
            />
          </div>
          <div className="text-right text-[11px] tabular-nums text-slate-500">
            {formatNumber(item.count)} · {formatShare(item.count, total)}
          </div>
        </div>
      ))}
    </div>
  );
};

const SplitBar: React.FC<{
  segments: Array<{ label: string; count: number; color: string }>;
}> = ({ segments }) => {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  if (!total) {
    return <ChartEmptyState label="No data recorded yet." />;
  }

  return (
    <div>
      <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-full">
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => (
            <div
              key={segment.label}
              title={`${segment.label}: ${formatNumber(segment.count)}`}
              style={{
                width: `${(segment.count / total) * 100}%`,
                backgroundColor: segment.color,
              }}
              className="rounded-sm first:rounded-l-full last:rounded-r-full"
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
        {segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            {segment.label}
            <span className="tabular-nums text-slate-400">
              {formatNumber(segment.count)} · {formatShare(segment.count, total)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Trend chart (SVG line chart with gridlines + hover tooltip)
// -------------------------------------------------------------

type TrendPoint = { x: string; values: Array<number | null> };

type TrendChartProps = {
  points: TrendPoint[];
  series: Array<{ label: string; color: string }>;
  valueFormatter?: (value: number | string | null | undefined) => string;
  area?: boolean;
};

const CHART_W = 760;
const CHART_H = 250;
const PAD = { top: 14, right: 16, bottom: 26, left: 46 };

const TrendChart: React.FC<TrendChartProps> = ({
  points,
  series,
  valueFormatter = formatNumber,
  area = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const yMax = niceCeiling(
    Math.max(
      1,
      ...points.flatMap((point) => point.values.map((value) => value ?? 0))
    )
  );

  const xFor = (index: number) =>
    points.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (index / (points.length - 1)) * plotW;
  const yFor = (value: number) => PAD.top + plotH - (value / yMax) * plotH;

  const tickValues = [0.25, 0.5, 0.75, 1].map((fraction) => yMax * fraction);

  const labelIndexes = Array.from(
    new Set(
      [0, 1 / 3, 2 / 3, 1].map((fraction) =>
        Math.round(fraction * (points.length - 1))
      )
    )
  );

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * CHART_W;
    const fraction = plotW ? (px - PAD.left) / plotW : 0;
    const index = Math.round(fraction * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipOnLeft = hoverIndex !== null && xFor(hoverIndex) > CHART_W * 0.6;

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
          {series.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          role="img"
          aria-label="Trend chart"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* gridlines + y labels */}
          {tickValues.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="#eef2f7"
              />
              <text
                x={PAD.left - 8}
                y={yFor(tick) + 3}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={CHART_W - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="#cbd5e1"
          />

          {/* x labels */}
          {labelIndexes.map((index) => (
            <text
              key={index}
              x={xFor(index)}
              y={CHART_H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {formatShortDate(points[index]?.x)}
            </text>
          ))}

          {/* area fill for single-series charts */}
          {area && series.length === 1 && points.length > 1 && (
            <polygon
              fill={series[0].color}
              fillOpacity="0.08"
              points={[
                `${xFor(0)},${PAD.top + plotH}`,
                ...points.map(
                  (point, index) =>
                    `${xFor(index)},${yFor(Number(point.values[0] ?? 0))}`
                ),
                `${xFor(points.length - 1)},${PAD.top + plotH}`,
              ].join(" ")}
            />
          )}

          {/* series lines */}
          {series.map((item, seriesIndex) => (
            <polyline
              key={item.label}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points
                .map(
                  (point, index) =>
                    `${xFor(index)},${yFor(
                      Number(point.values[seriesIndex] ?? 0)
                    )}`
                )
                .join(" ")}
            />
          ))}

          {/* hover crosshair + markers */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={xFor(hoverIndex)}
                x2={xFor(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              {series.map((item, seriesIndex) => (
                <circle
                  key={item.label}
                  cx={xFor(hoverIndex)}
                  cy={yFor(
                    Number(points[hoverIndex]?.values[seriesIndex] ?? 0)
                  )}
                  r="4"
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] shadow-lg"
            style={
              tooltipOnLeft
                ? {
                    right: `${100 - (xFor(hoverIndex) / CHART_W) * 100 + 2}%`,
                  }
                : { left: `${(xFor(hoverIndex) / CHART_W) * 100 + 2}%` }
            }
          >
            <div className="font-semibold text-slate-700">
              {formatShortDate(hovered.x)}
            </div>
            {series.map((item, seriesIndex) => (
              <div
                key={item.label}
                className="mt-1 flex items-center gap-2 text-slate-600"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}:{" "}
                <span className="font-semibold tabular-nums">
                  {valueFormatter(hovered.values[seriesIndex])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Retention
// -------------------------------------------------------------

const RetentionSection: React.FC<{ rows: RetentionRow[] }> = ({ rows }) => {
  const totals = rows.reduce(
    (acc, row) => {
      acc.installs += Number(row.downloaded_installations ?? 0);
      acc.d1 += Number(row.retained_day_1 ?? 0);
      acc.d7 += Number(row.retained_day_7 ?? 0);
      acc.d30 += Number(row.retained_day_30 ?? 0);
      return acc;
    },
    { installs: 0, d1: 0, d7: 0, d30: 0 }
  );

  const displayRows = rows.slice(-10).reverse();

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {(
          [
            ["Day 1", totals.d1],
            ["Day 7", totals.d7],
            ["Day 30", totals.d30],
          ] as const
        ).map(([label, retained], index) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {label} retention
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ORDINAL_BLUES[index] }}
              />
              <span className="text-lg font-bold text-slate-900">
                {totals.installs
                  ? `${((retained / totals.installs) * 100).toFixed(0)}%`
                  : "-"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {displayRows.map((row, index) => {
          const total = Number(row.downloaded_installations ?? 0);
          return (
            <div
              key={row.install_date ?? `retention-${index}`}
              className="grid grid-cols-[80px_1fr_100px] items-center gap-3 text-xs"
            >
              <div className="text-slate-500">
                {formatShortDate(row.install_date)}
              </div>
              <div className="space-y-1.5">
                <RetentionBar
                  label="D1"
                  value={getRetentionPercent(row.retained_day_1, total)}
                  color={ORDINAL_BLUES[0]}
                />
                <RetentionBar
                  label="D7"
                  value={getRetentionPercent(row.retained_day_7, total)}
                  color={ORDINAL_BLUES[1]}
                />
                <RetentionBar
                  label="D30"
                  value={getRetentionPercent(row.retained_day_30, total)}
                  color={ORDINAL_BLUES[2]}
                />
              </div>
              <div className="text-right text-[11px] leading-4 text-slate-500">
                <div>{formatNumber(total)} installs</div>
                <div>{formatNumber(row.inferred_uninstalled)} uninstalled</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RetentionBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div className="grid grid-cols-[30px_1fr_38px] items-center gap-2">
    <span className="text-[10px] font-semibold text-slate-500">{label}</span>
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
    <span className="text-right text-[10px] tabular-nums text-slate-600">
      {value.toFixed(0)}%
    </span>
  </div>
);

// -------------------------------------------------------------
// Sortable table
// -------------------------------------------------------------

type Column<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: Array<Column<T>>;
  rows: T[];
  sortKey: keyof T;
  sortDirection: SortDirection;
  onSort: (key: keyof T) => void;
  emptyLabel: string;
};

const DataTable = <T extends Record<string, unknown>>({
  columns,
  rows,
  sortKey,
  sortDirection,
  onSort,
  emptyLabel,
}: DataTableProps<T>) => {
  if (!rows.length) return <ChartEmptyState label={emptyLabel} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-3 py-2 font-semibold ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSort(column.key)}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  {column.label}
                  {sortKey === column.key && (
                    <span aria-hidden>
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-slate-100 text-slate-700 last:border-0 hover:bg-slate-50"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-3 py-2 align-middle tabular-nums ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

function toggleSort<K extends string | number | symbol>(
  current: { key: K; direction: SortDirection },
  key: K
): { key: K; direction: SortDirection } {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }

  return { key, direction: "desc" as const };
}

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  direction: SortDirection
) {
  return [...rows].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (typeof aValue === "number" || typeof bValue === "number") {
      return compare(Number(aValue ?? 0), Number(bValue ?? 0), direction);
    }

    return compare(String(aValue ?? ""), String(bValue ?? ""), direction);
  });
}

function compare<T extends number | string>(
  a: T,
  b: T,
  direction: SortDirection
) {
  if (a < b) return direction === "asc" ? -1 : 1;
  if (a > b) return direction === "asc" ? 1 : -1;
  return 0;
}

function filterByDateRange<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  range: DateRangeKey
) {
  if (range === "all") return rows;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  return rows.filter((row) => {
    const value = row[key];
    if (!value) return false;
    return new Date(String(value)) >= cutoff;
  });
}

function getRetentionPercent(
  retained: number | null | undefined,
  downloadedInstallations: number
) {
  if (!downloadedInstallations) return 0;
  return (Number(retained ?? 0) / downloadedInstallations) * 100;
}

function foldTail(rows: PlatformCount[], keep: number): PlatformCount[] {
  if (rows.length <= keep) return rows;
  const head = rows.slice(0, keep);
  const tail = rows.slice(keep);
  head.push({
    label: `Other (${tail.length})`,
    installations: tail.reduce((sum, row) => sum + row.installations, 0),
    installedNow: tail.reduce((sum, row) => sum + row.installedNow, 0),
  });
  return head;
}

function niceCeiling(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function formatAgeBand(value: string | null | undefined) {
  if (!value || value.toLowerCase() === "unknown") return "Not provided";
  const rangeMatch = value.match(/^(\d+)_(\d+)$/);
  if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]}`;
  const plusMatch = value.match(/^(\d+)_?plus$/i);
  if (plusMatch) return `${plusMatch[1]}+`;
  if (/^under_?(\d+)$/i.test(value)) {
    return `Under ${value.replace(/\D/g, "")}`;
  }
  return humanize(value);
}

function ageBandSortKey(value: string | null | undefined) {
  if (!value || value.toLowerCase() === "unknown") return Number.MAX_SAFE_INTEGER;
  const firstNumber = value.match(/\d+/);
  if (/^under/i.test(value)) return 0;
  return firstNumber ? Number(firstNumber[0]) : Number.MAX_SAFE_INTEGER - 1;
}

function humanize(value: string | null | undefined) {
  if (!value || value.toLowerCase() === "unknown") return "Not provided";
  const text = value.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatShare(
  part: number | null | undefined,
  total: number | null | undefined
) {
  if (
    part === null ||
    part === undefined ||
    !total ||
    Number.isNaN(Number(part))
  ) {
    return "-";
  }
  return `${((Number(part) / Number(total)) * 100).toFixed(0)}%`;
}

async function getCurrentAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[Analytics] getSession failed", error);
    return null;
  }

  return data.session?.access_token ?? null;
}

async function refreshAccessToken() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error("[Analytics] refreshSession failed", error);
    return null;
  }

  return data.session?.access_token ?? null;
}

function requestAnalytics(accessToken: string) {
  return fetch("/api/analytics", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function assertJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Analytics API returned a non-JSON response. Restart the dev server so /api/analytics is handled by the server route."
    );
  }
}

function formatNumber(value: number | string | null | undefined) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return numberFormatter.format(Math.round(Number(value)));
}

function formatDuration(value: number | string | null | undefined) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  const seconds = Math.max(0, Math.round(Number(value)));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) {
    return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const minuteRemainder = minutes % 60;
  return minuteRemainder ? `${hours}h ${minuteRemainder}m` : `${hours}h`;
}

function formatDateTime(value: number | string | null | undefined) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    month: "short",
    day: "2-digit",
  }).format(date);
}
