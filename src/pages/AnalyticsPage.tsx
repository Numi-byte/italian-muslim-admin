import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabaseClient";

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

type AnalyticsPayload = {
  overview: Overview | null;
  masjidActiveUsers: MasjidActiveUsersRow[];
  pageTime: PageTimeRow[];
  retention: RetentionRow[];
  dailyFrequency: FrequencyRow[];
};

type DateRangeKey = "7d" | "30d" | "90d" | "all";

const dateRangeOptions: Array<{ label: string; value: DateRangeKey }> = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "All", value: "all" },
];

const numberFormatter = new Intl.NumberFormat("it-IT");

const AnalyticsPage: React.FC = () => {
  const { session } = useAuth();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const [dateRange, setDateRange] = useState<DateRangeKey>("30d");
  const [masjidFilter, setMasjidFilter] = useState("all");
  const [pageSort, setPageSort] = useState<{
    key: keyof PageTimeRow;
    direction: SortDirection;
  }>({ key: "total_seconds", direction: "desc" });
  const [masjidSort, setMasjidSort] = useState<{
    key: keyof MasjidActiveUsersRow;
    direction: SortDirection;
  }>({ key: "active_signed_users_24h", direction: "desc" });

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

    const channel = supabase
      .channel("analytics-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_installations" },
        () => void fetchAnalytics()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_sessions" },
        () => void fetchAnalytics()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_page_views" },
        () => void fetchAnalytics()
      )
      .subscribe((status) => {
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
  const masjidOptions = useMemo(() => {
    const names = new Set<string>();
    data?.masjidActiveUsers.forEach((row) => {
      if (row.masjid_name) names.add(row.masjid_name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data?.masjidActiveUsers]);

  const filteredRetention = useMemo(
    () => filterByDateRange(data?.retention ?? [], "install_date", dateRange),
    [data?.retention, dateRange]
  );

  const filteredFrequency = useMemo(
    () => filterByDateRange(data?.dailyFrequency ?? [], "date", dateRange),
    [data?.dailyFrequency, dateRange]
  );

  const sortedMasjids = useMemo(() => {
    const rows =
      masjidFilter === "all"
        ? data?.masjidActiveUsers ?? []
        : (data?.masjidActiveUsers ?? []).filter(
            (row) => row.masjid_name === masjidFilter
          );
    return sortRows(rows, masjidSort.key, masjidSort.direction);
  }, [data?.masjidActiveUsers, masjidFilter, masjidSort]);

  const sortedPageTime = useMemo(
    () => sortRows(data?.pageTime ?? [], pageSort.key, pageSort.direction),
    [data?.pageTime, pageSort]
  );

  const hasAnyData =
    Boolean(overview) ||
    Boolean(data?.masjidActiveUsers.length) ||
    Boolean(data?.pageTime.length) ||
    Boolean(data?.retention.length) ||
    Boolean(data?.dailyFrequency.length);

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading live analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-50">
              Live app analytics
            </h2>
            <LiveBadge status={liveStatus} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Server-side reads from analytics views. No personal data is shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <FilterSelect
            label="Range"
            value={dateRange}
            onChange={(value) => setDateRange(value as DateRangeKey)}
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Masjid"
            value={masjidFilter}
            onChange={setMasjidFilter}
          >
            <option value="all">All masjids</option>
            {masjidOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FilterSelect>
          <DisabledFilter label="Platform" value="View needed" />
          <DisabledFilter label="Version" value="View needed" />
          <button
            type="button"
            onClick={() => void fetchAnalytics()}
            className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-[11px] font-medium text-slate-100 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            disabled={refreshing}
          >
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-950/50 p-3 text-xs text-red-100">
          {error}
        </div>
      )}

      {!hasAnyData && !error && (
        <EmptyPanel title="No analytics yet">
          App installs, sessions, and page views will appear here as soon as the
          mobile app starts writing analytics events.
        </EmptyPanel>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Downloaded installations"
          value={overview?.total_downloaded_installations}
          detail="Unique client installations"
        />
        <MetricCard
          label="Installed now"
          value={overview?.installed_now}
          detail="Not marked uninstalled"
        />
        <MetricCard
          label="Inferred uninstalled"
          value={overview?.inferred_uninstalled}
          detail="Push receipt or inactivity inference"
        />
        <MetricCard
          label="Active installations 24h"
          value={overview?.active_installations_24h}
          detail="Seen in the last 24 hours"
        />
        <MetricCard
          label="Active signed masjid users"
          value={overview?.active_signed_masjid_users_24h}
          detail="Signed in with a masjid, last 24h"
        />
        <MetricCard
          label="Sessions today"
          value={overview?.sessions_today}
          detail="App opens recorded today"
        />
        <MetricCard
          label="Avg session today"
          value={overview?.avg_session_seconds_today}
          detail="Mean session duration"
          formatter={formatDuration}
        />
        <MetricCard
          label="Latest refresh"
          value={overview?.generated_at}
          detail="analytics_live_overview.generated_at"
          formatter={formatDateTime}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <Panel
          title="Daily frequency"
          subtitle="How often users enter the app per day."
        >
          {filteredFrequency.length ? (
            <LineChart
              rows={filteredFrequency}
              xKey="date"
              series={[
                { key: "app_opens", label: "App opens", color: "#34d399" },
                {
                  key: "active_installations",
                  label: "Active installations",
                  color: "#60a5fa",
                },
              ]}
            />
          ) : (
            <TableEmptyState label="No frequency rows in this range." />
          )}
        </Panel>

        <Panel
          title="Retention"
          subtitle="Install cohorts with D1, D7, and D30 retention."
        >
          {filteredRetention.length ? (
            <RetentionChart rows={filteredRetention} />
          ) : (
            <TableEmptyState label="No retention rows in this range." />
          )}
        </Panel>
      </div>

      <Panel
        title="Masjid active users"
        subtitle="The view already excludes uninstalled installations."
      >
        <DataTable
          columns={[
            {
              key: "masjid_name",
              label: "Masjid",
              render: (row) => row.masjid_name ?? "Unknown masjid",
            },
            { key: "city", label: "City", render: (row) => row.city ?? "-" },
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
              label: "Installations 7d",
              align: "right",
              render: (row) => formatNumber(row.active_installations_7d),
            },
          ]}
          rows={sortedMasjids}
          sortKey={masjidSort.key}
          sortDirection={masjidSort.direction}
          onSort={(key) =>
            setMasjidSort((current) => toggleSort(current, key))
          }
          emptyLabel="No masjid activity yet."
        />
      </Panel>

      <Panel
        title="Page time"
        subtitle="Sorted by total time so the busiest app surfaces appear first."
      >
        <DataTable
          columns={[
            {
              key: "page_path",
              label: "Page path",
              render: (row) => row.page_path ?? "Unknown page",
            },
            {
              key: "views",
              label: "Views",
              align: "right",
              render: (row) => formatNumber(row.views),
            },
            {
              key: "unique_installations",
              label: "Unique installs",
              align: "right",
              render: (row) => formatNumber(row.unique_installations),
            },
            {
              key: "total_seconds",
              label: "Total time",
              align: "right",
              render: (row) => formatDuration(row.total_seconds),
            },
            {
              key: "avg_seconds",
              label: "Avg time",
              align: "right",
              render: (row) => formatDuration(row.avg_seconds),
            },
            {
              key: "last_viewed_at",
              label: "Last viewed",
              align: "right",
              render: (row) => formatDateTime(row.last_viewed_at),
            },
          ]}
          rows={sortedPageTime}
          sortKey={pageSort.key}
          sortDirection={pageSort.direction}
          onSort={(key) => setPageSort((current) => toggleSort(current, key))}
          emptyLabel="No page views have been recorded yet."
        />
      </Panel>
    </div>
  );
};

export default AnalyticsPage;

type MetricCardProps = {
  label: string;
  value: number | string | null | undefined;
  detail: string;
  formatter?: (value: number | string | null | undefined) => string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  detail,
  formatter = formatNumber,
}) => (
  <div className="min-h-28 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-3 text-2xl font-semibold text-slate-50">
      {formatter(value)}
    </div>
    <div className="mt-2 text-[11px] leading-4 text-slate-400">{detail}</div>
  </div>
);

type PanelProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const Panel: React.FC<PanelProps> = ({ title, subtitle, children }) => (
  <section className="rounded-lg border border-slate-800 bg-slate-950/60">
    <div className="border-b border-slate-800 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyPanel: React.FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
    <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
    <p className="mt-2 text-xs text-slate-400">{children}</p>
  </div>
);

const LiveBadge: React.FC<{ status: "connecting" | "live" | "offline" }> = ({
  status,
}) => {
  const statusClass =
    status === "live"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : status === "connecting"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
        : "border-red-500/50 bg-red-500/10 text-red-200";

  return (
    <span
      className={`inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-wide ${statusClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === "live" ? "Live" : status}
    </span>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}> = ({ label, value, onChange, children }) => (
  <label className="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 text-[11px] text-slate-400">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="bg-transparent text-slate-100 outline-none"
    >
      {children}
    </select>
  </label>
);

const DisabledFilter: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 text-[11px] text-slate-500 opacity-70">
    <span>{label}</span>
    <span className="text-slate-400">{value}</span>
  </div>
);

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
  if (!rows.length) return <TableEmptyState label={emptyLabel} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
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
                  className="inline-flex items-center gap-1 hover:text-slate-200"
                >
                  {column.label}
                  {sortKey === column.key && (
                    <span>{sortDirection === "asc" ? "^" : "v"}</span>
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
              className="border-b border-slate-900 text-slate-300 last:border-0 hover:bg-slate-900/50"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-3 py-2 align-middle ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <div className="truncate">{column.render(row)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TableEmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-md border border-dashed border-slate-800 bg-slate-950/50 px-4 py-8 text-center text-xs text-slate-500">
    {label}
  </div>
);

type LineChartProps = {
  rows: FrequencyRow[];
  xKey: keyof FrequencyRow;
  series: Array<{
    key: keyof FrequencyRow;
    label: string;
    color: string;
  }>;
};

const LineChart: React.FC<LineChartProps> = ({ rows, xKey, series }) => {
  const width = 760;
  const height = 260;
  const padding = 28;
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) =>
      series.map((item) => Number(row[item.key] ?? 0))
    )
  );

  const pointsFor = (key: keyof FrequencyRow) =>
    rows
      .map((row, index) => {
        const x =
          rows.length === 1
            ? width / 2
            : padding +
              (index / (rows.length - 1)) * (width - padding * 2);
        const y =
          height -
          padding -
          (Number(row[key] ?? 0) / maxValue) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  const latest = rows.at(-1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
        {series.map((item) => (
          <span key={String(item.key)} className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
        {latest && (
          <span className="ml-auto">
            Latest {formatShortDate(String(latest[xKey] ?? ""))}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full overflow-visible"
        role="img"
        aria-label="Daily frequency chart"
      >
        <line
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
          stroke="#334155"
        />
        {series.map((item) => (
          <polyline
            key={String(item.key)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsFor(item.key)}
          />
        ))}
      </svg>
    </div>
  );
};

const RetentionChart: React.FC<{ rows: RetentionRow[] }> = ({ rows }) => {
  const displayRows = rows.slice(-12);

  return (
    <div className="space-y-3">
      {displayRows.map((row, index) => {
        const total = Number(row.downloaded_installations ?? 0);
        const d1 = getRetentionPercent(row.retained_day_1, total);
        const d7 = getRetentionPercent(row.retained_day_7, total);
        const d30 = getRetentionPercent(row.retained_day_30, total);

        return (
          <div
            key={row.install_date ?? `retention-${index}`}
            className="grid grid-cols-[88px_1fr_72px] items-center gap-3 text-xs"
          >
            <div className="text-slate-400">
              {formatShortDate(row.install_date)}
            </div>
            <div className="space-y-1.5">
              <RetentionBar label="D1" value={d1} color="bg-emerald-400" />
              <RetentionBar label="D7" value={d7} color="bg-sky-400" />
              <RetentionBar label="D30" value={d30} color="bg-amber-300" />
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div>{formatNumber(total)} installs</div>
              <div>{formatNumber(row.inferred_uninstalled)} uninst.</div>
              <div>{formatDecimal(row.average_days_installed)} avg days</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RetentionBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div className="grid grid-cols-[34px_1fr_42px] items-center gap-2">
    <span className="text-[10px] font-semibold text-slate-500">{label}</span>
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-right text-[10px] text-slate-300">
      {value.toFixed(0)}%
    </span>
  </div>
);

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

function formatDecimal(value: number | string | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 1,
  }).format(Number(value));
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
  if (minutes < 60) return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;

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
