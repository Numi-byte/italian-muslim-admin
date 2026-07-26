import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/authContext";
import { Alert, Badge, Button, Spinner, cn } from "../components/ui";

type PremiumStatus = {
  user_id: string;
  founding_supporter: boolean | null;
  lifetime_premium: boolean | null;
  platform: string | null;
  product_id: string | null;
  purchased_at: string | null;
  verified_at: string | null;
  revoked_at: string | null;
  has_lifetime_premium: boolean | null;
};

type PurchaseEvent = {
  id: string;
  platform: string;
  product_id: string;
  transaction_id: string | null;
  original_transaction_id: string | null;
  event_type: string;
  status: string;
  created_at: string;
};

type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
type SalahStatus = "completed" | "missed" | "excused";

type SalahLog = {
  id: string;
  user_id: string;
  prayer_date: string;
  prayer_name: PrayerName;
  status: SalahStatus;
  completed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type PrayerDayStatus = {
  prayer: PrayerName;
  status: SalahStatus | null;
};

type MonthDayInsight = {
  iso: string;
  count: number;
  date: number;
  active: boolean;
  isToday: boolean;
  weekday: string;
  label: string;
  statuses: PrayerDayStatus[];
  completed: number;
  missed: number;
  excused: number;
  unlogged: number;
  logged: number;
  percentage: number;
};

type PrayerInsight = {
  prayer: PrayerName;
  label: string;
  completed: number;
  missed: number;
  excused: number;
  unlogged: number;
  logged: number;
  goal: number;
  percentage: number;
};

type WeekDayInsight = {
  iso: string;
  count: number;
  letter: string;
  isToday: boolean;
};

type SalahInsights = {
  streak: number;
  weekDays: WeekDayInsight[];
  monthDays: MonthDayInsight[];
  monthlyStats: {
    completed: number;
    missed: number;
    excused: number;
    unlogged: number;
    logged: number;
    goal: number;
    goalDone: number;
    percentage: number;
    perfectDays: number;
    activeDays: number;
  };
  prayerInsights: PrayerInsight[];
  progressStats: {
    last7Completed: number;
    last7Goal: number;
    last7Percentage: number;
    bestStreak: number;
    bestDay: MonthDayInsight | null;
    today: MonthDayInsight | null;
  };
  selectedDay: MonthDayInsight | null;
};

type Masjid = {
  id: string;
  official_name: string;
  city: string | null;
};

type AccountPageProps = {
  onContactSupport?: () => void;
};

const APPLE_REFUND_URL = "https://support.apple.com/en-us/118223";
const GOOGLE_PLAY_REFUND_URL =
  "https://support.google.com/googleplay/answer/2479637?hl=en-EN";
const FOUNDING_SUPPORTER_PRODUCT_ID = "ummahway_founding_supporter_lifetime";
const PRAYER_ORDER: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const FOUNDING_SUPPORTER_UNLOCKS = [
  {
    title: "Premium themes",
    text: "Makkah, Madinah, Ramadan, Eid, Dark Minimal, Sunset, and any active premium theme collection shown in the app.",
  },
  {
    title: "Salah Tracker Pro",
    text: "Prayer streaks, insights, analytics, and extended tracking tools.",
  },
  {
    title: "Unlimited Dua Journal",
    text: "Removes the current free limit of three private dua entries.",
  },
  {
    title: "Founding Supporter badge",
    text: "A permanent supporter label on the account while the entitlement remains valid.",
  },
  {
    title: "Founding Wall",
    text: "Optional public wall entry with display name, optional message, and join date.",
  },
  {
    title: "Selected future premium access",
    text: "Includes planned premium launches such as Ramadan Tracker Pro when made available.",
  },
];

const PURCHASE_CHECKS = [
  "Use the native iOS or Android app. Web builds and Expo Go cannot complete this in-app purchase.",
  "Sign in before buying or restoring so the store purchase can attach to the correct UmmahWay account.",
  "Use the same Apple ID or Google account that completed checkout, then tap Restore Purchases in the app.",
  "If the product does not load, the App Store Connect or Google Play Console product may still be pending, inactive, or unavailable in that region.",
  "For support, send platform, product ID, purchase date, and order or transaction reference. Do not send full card numbers.",
];

const panelClass =
  "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm shadow-slate-900/[0.03]";
const labelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

const AccountPage: React.FC<AccountPageProps> = ({ onContactSupport }) => {
  const {
    user,
    profile,
    isAdmin,
    isPrayerTimingEditor,
    accessiblePrayerMasjidIds,
  } = useAuth();
  const userId = user?.id;
  const assignedMasjidKey = accessiblePrayerMasjidIds.join("|");
  const assignedMasjidIds = useMemo(
    () => (assignedMasjidKey ? assignedMasjidKey.split("|") : []),
    [assignedMasjidKey]
  );
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [purchaseEvents, setPurchaseEvents] = useState<PurchaseEvent[]>([]);
  const [salahLogs, setSalahLogs] = useState<SalahLog[]>([]);
  const [salahError, setSalahError] = useState<string | null>(null);
  const [todayIso, setTodayIso] = useState(() => getTodayIso());
  const [selectedSalahDate, setSelectedSalahDate] = useState(() =>
    getTodayIso()
  );
  const [assignedMasjids, setAssignedMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accountLocale = useMemo(
    () =>
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-GB",
    []
  );

  const loadAccount = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSalahError(null);
    const currentTodayIso = getTodayIso();
    setTodayIso(currentTodayIso);

    const premiumQuery = supabase
      .from("user_premium_status")
      .select(
        "user_id, founding_supporter, lifetime_premium, platform, product_id, purchased_at, verified_at, revoked_at, has_lifetime_premium"
      )
      .eq("user_id", userId)
      .maybeSingle();

    const eventsQuery = supabase
      .from("purchase_events")
      .select(
        "id, platform, product_id, transaction_id, original_transaction_id, event_type, status, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const masjidsQuery =
      assignedMasjidIds.length > 0
        ? supabase
            .from("public_masjids")
            .select("id, official_name, city")
            .in("id", assignedMasjidIds)
        : null;

    const [premiumResult, eventsResult, masjidsResult] = await Promise.all([
      premiumQuery,
      eventsQuery,
      masjidsQuery,
    ]);

    const nextPremium = premiumResult.error
      ? null
      : ((premiumResult.data as PremiumStatus | null) ?? null);

    if (premiumResult.error) {
      setPremium(null);
      setError(premiumResult.error.message);
    } else {
      setPremium(nextPremium);
    }

    if (eventsResult.error) {
      setPurchaseEvents([]);
      setError((current) => current ?? eventsResult.error.message);
    } else {
      setPurchaseEvents((eventsResult.data ?? []) as PurchaseEvent[]);
    }

    if (masjidsResult?.error) {
      setAssignedMasjids([]);
      setError((current) => current ?? masjidsResult.error.message);
    } else {
      setAssignedMasjids(((masjidsResult?.data ?? []) as Masjid[]) ?? []);
    }

    const canLoadSalahInsights = Boolean(
      nextPremium?.has_lifetime_premium && !nextPremium.revoked_at
    );

    if (canLoadSalahInsights) {
      const { data: logsData, error: logsError } = await supabase
        .from("salah_logs")
        .select(
          "id, user_id, prayer_date, prayer_name, status, completed_at, note, created_at, updated_at"
        )
        .eq("user_id", userId)
        .gte("prayer_date", addDaysIso(currentTodayIso, -60))
        .lte("prayer_date", currentTodayIso)
        .order("prayer_date", { ascending: false })
        .order("prayer_name", { ascending: true });

      if (logsError) {
        setSalahLogs([]);
        setSalahError(logsError.message);
      } else {
        setSalahLogs((logsData ?? []) as SalahLog[]);
      }
    } else {
      setSalahLogs([]);
    }

    setLoading(false);
  }, [assignedMasjidIds, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccount();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount]);

  const hasPremium = Boolean(premium?.has_lifetime_premium);
  const isRevoked = Boolean(premium?.revoked_at);
  const premiumActive = hasPremium && !isRevoked;
  const salahInsights = useMemo(
    () =>
      buildSalahInsights(
        salahLogs,
        selectedSalahDate,
        todayIso,
        accountLocale
      ),
    [accountLocale, salahLogs, selectedSalahDate, todayIso]
  );
  const accessLabel = isAdmin
    ? "Super admin"
    : isPrayerTimingEditor
      ? "Jamaah timing editor"
      : "Account holder";
  const purchaseModel = premium?.lifetime_premium
    ? "Founding Supporter lifetime"
    : premium
      ? "Store entitlement recorded"
      : "No purchase on this account";

  if (!user) {
    return (
      <div className={panelClass}>
        <h2 className="text-base font-semibold">Account unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in again to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Signed in as{" "}
          <span className="font-medium text-slate-700">
            {user.email ?? "this account"}
          </span>{" "}
          - {accessLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void loadAccount()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          {onContactSupport && (
            <Button size="sm" onClick={onContactSupport}>
              Contact support
            </Button>
          )}
        </div>
      </div>

      {error && <Alert tone="warning">{error}</Alert>}

      <div className="grid gap-3 md:grid-cols-3">
        <StatusCard
          label="Purchase status"
          value={hasPremium && !isRevoked ? "Active" : "Not active"}
          tone={hasPremium && !isRevoked ? "success" : "muted"}
        />
        <StatusCard label="Purchase model" value={purchaseModel} tone="info" />
        <StatusCard
          label="Admin access"
          value={accessLabel}
          tone={isAdmin || isPrayerTimingEditor ? "success" : "muted"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={panelClass}>
          <div className={labelClass}>Account</div>
          <dl className="mt-4 space-y-3 text-sm">
            <DetailRow label="Email" value={user.email ?? "Not recorded"} />
            <DetailRow label="User ID" value={maskValue(user.id)} mono />
            <DetailRow label="Profile role" value={profile?.role ?? "None"} />
            <DetailRow
              label="Special access"
              value={
                isAdmin
                  ? "All admin areas"
                  : isPrayerTimingEditor
                    ? "Assigned Jamaah timing editor"
                    : "None"
              }
            />
          </dl>

          {assignedMasjids.length > 0 && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-semibold text-emerald-800">
                Assigned masjid timing access
              </div>
              <div className="mt-2 space-y-1.5">
                {assignedMasjids.map((masjid) => (
                  <div key={masjid.id} className="text-sm text-slate-700">
                    {masjid.official_name}
                    {masjid.city ? (
                      <span className="text-slate-400"> - {masjid.city}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className={panelClass}>
          <div className={labelClass}>Premium entitlement</div>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Spinner />
              Loading purchase status...
            </div>
          ) : premium ? (
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <DetailRow
                label="Premium active"
                value={hasPremium && !isRevoked ? "Yes" : "No"}
              />
              <DetailRow
                label="Founding supporter"
                value={premium.founding_supporter ? "Yes" : "No"}
              />
              <DetailRow
                label="Platform"
                value={formatPlatform(premium.platform)}
              />
              <DetailRow
                label="Product"
                value={premium.product_id ?? "Not recorded"}
                mono
              />
              <DetailRow
                label="Purchased"
                value={formatDateTime(premium.purchased_at)}
              />
              <DetailRow
                label="Verified"
                value={formatDateTime(premium.verified_at)}
              />
              <DetailRow
                label="Revoked"
                value={formatDateTime(premium.revoked_at)}
              />
            </dl>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-500">
              No premium purchase or entitlement is linked to this login yet.
            </div>
          )}
        </section>
      </div>

      <SalahTrackerInsightsSection
        active={premiumActive}
        loading={loading}
        error={salahError}
        insights={salahInsights}
        selectedDate={selectedSalahDate}
        onSelectDate={setSelectedSalahDate}
      />

      <section className={panelClass}>
        <div className={labelClass}>Purchase guidance</div>
        <div className="mt-4 grid gap-4 text-sm text-slate-600 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 leading-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={premiumActive ? "emerald" : "slate"}>
                  {premiumActive ? "Entitlement active" : "Not active"}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Founding Supporter lifetime
                </span>
              </div>
              <p className="mt-3 text-sm text-emerald-950">
                Product{" "}
                <span className="break-all font-mono text-xs">
                  {premium?.product_id ?? FOUNDING_SUPPORTER_PRODUCT_ID}
                </span>{" "}
                is the app&apos;s founding member purchase. It is a one-time,
                non-consumable Apple App Store or Google Play in-app purchase,
                not a recurring subscription.
              </p>
            </div>
            <p>
              A valid purchase is verified by the UmmahWay backend before
              premium access is turned on. The mobile app sends Apple
              transaction proof on iOS or a Google Play purchase token on
              Android, and the backend records the platform, product ID,
              transaction identifiers, purchase date, verification date, and
              revocation status.
            </p>
            <p>
              The account is treated as premium when{" "}
              <span className="font-mono text-xs text-slate-800">
                has_lifetime_premium
              </span>{" "}
              is true and no revoked date is present. Refunded, revoked, charged
              back, or invalid purchases may remove premium access.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What it unlocks
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {FOUNDING_SUPPORTER_UNLOCKS.map((item) => (
                <li key={item.title}>
                  <span className="font-semibold text-slate-900">
                    {item.title}:
                  </span>{" "}
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 text-sm text-slate-600 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Restore and troubleshooting
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {PURCHASE_CHECKS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Refunds and support
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>
                Apple purchases: request refunds through{" "}
                <a
                  href={APPLE_REFUND_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 underline"
                >
                  Apple Support
                </a>
                .
              </li>
              <li>
                Google Play purchases: review refund options through{" "}
                <a
                  href={GOOGLE_PLAY_REFUND_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 underline"
                >
                  Google Play Help
                </a>
                .
              </li>
              <li>
                For missing entitlements, contact support with platform,
                product ID, purchase date, and order or transaction reference.
                Never send full card numbers.
              </li>
            </ul>
            {onContactSupport && (
              <Button size="sm" className="mt-4" onClick={onContactSupport}>
                Contact support
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={labelClass}>Purchase events</div>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              Recent purchase history
            </h3>
          </div>
          <Badge tone="slate">{purchaseEvents.length} events</Badge>
        </div>

        {purchaseEvents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-500">
            No purchase events have been recorded for this account.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Event</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Platform</th>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseEvents.map((event) => (
                  <tr key={event.id} className="align-top text-slate-600">
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDateTime(event.created_at)}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {humanize(event.event_type)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="slate">{humanize(event.status)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      {formatPlatform(event.platform)}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                      {event.product_id}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                      {maskValue(
                        event.transaction_id ?? event.original_transaction_id
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const SalahTrackerInsightsSection: React.FC<{
  active: boolean;
  loading: boolean;
  error: string | null;
  insights: SalahInsights;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}> = ({ active, loading, error, insights, selectedDate, onSelectDate }) => {
  const {
    streak,
    weekDays,
    monthDays,
    monthlyStats,
    prayerInsights,
    progressStats,
    selectedDay,
  } = insights;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={labelClass}>Salah Tracker Pro</div>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            Private prayer analytics
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            The same premium prayer statistics from the app, shown privately for
            active Founding Supporter accounts.
          </p>
        </div>
        <Badge tone={active ? "emerald" : "slate"}>
          {active ? "Founding member private" : "Premium only"}
        </Badge>
      </div>

      {!active ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-500">
          Detailed streaks, the 30-day heatmap, status totals, and by-prayer
          analytics appear here when this account has active Founding Supporter
          lifetime access.
        </div>
      ) : loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Spinner />
          Loading private prayer analytics...
        </div>
      ) : error ? (
        <Alert tone="warning" className="mt-4">
          {error}
        </Alert>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <MetricRing progress={Math.min(1, Math.max(streak, 0) / 30)}>
                  <div className="text-3xl font-bold text-slate-950">
                    {streak}
                  </div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500">
                    Day streak
                  </div>
                </MetricRing>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-emerald-950">
                    Current momentum
                  </div>
                  <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                    A streak counts days where all five Salah entries are marked
                    completed.
                  </p>
                  <StatusSegmentBar
                    completed={monthlyStats.completed}
                    missed={monthlyStats.missed}
                    excused={monthlyStats.excused}
                    unlogged={monthlyStats.unlogged}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InsightTile
                label="Current streak"
                value={streak}
                detail="Day streak"
                tone="emerald"
              />
              <InsightTile
                label="Best streak"
                value={progressStats.bestStreak}
                detail="Last 30 days"
                tone="amber"
              />
              <InsightTile
                label="Last 7 days"
                value={`${progressStats.last7Percentage}%`}
                detail={`${progressStats.last7Completed}/${progressStats.last7Goal}`}
                tone="sky"
              />
              <InsightTile
                label="Today"
                value={`${progressStats.today?.count ?? 0}/5`}
                detail={progressStats.today?.label ?? "Today"}
                tone="sky"
              />
              <InsightTile
                label="Best day"
                value={`${progressStats.bestDay?.count ?? 0}/5`}
                detail={progressStats.bestDay?.label ?? "No logs yet"}
                tone="amber"
              />
              <InsightTile
                label="30-day rate"
                value={`${monthlyStats.percentage}%`}
                detail={`${monthlyStats.completed}/${monthlyStats.goal}`}
                tone="emerald"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Weekly trend
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Completed Salah over the last 7 days
                  </div>
                </div>
                <Badge tone="sky">{progressStats.last7Percentage}%</Badge>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day.iso} className="flex min-w-0 flex-col items-center">
                    <div className="flex h-28 w-full items-end rounded-lg bg-white p-1 ring-1 ring-slate-200">
                      <div
                        className={cn(
                          "w-full rounded-md transition",
                          day.count >= 5 ? "bg-emerald-500" : "bg-emerald-300",
                          day.count > 0 ? "opacity-100" : "opacity-25"
                        )}
                        style={{
                          height: `${Math.max(8, (day.count / 5) * 100)}%`,
                        }}
                      />
                    </div>
                    <div
                      className={cn(
                        "mt-2 text-xs font-semibold",
                        day.isToday ? "text-emerald-700" : "text-slate-700"
                      )}
                    >
                      {day.count}/5
                    </div>
                    <div
                      className={cn(
                        "text-[11px] font-semibold uppercase",
                        day.isToday ? "text-emerald-700" : "text-slate-400"
                      )}
                    >
                      {day.letter}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Monthly overview
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    150 prayer slots across the last 30 days
                  </div>
                </div>
                <MetricRing
                  progress={monthlyStats.percentage / 100}
                  sizeClassName="h-20 w-20"
                >
                  <div className="text-lg font-bold text-slate-950">
                    {monthlyStats.percentage}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    {monthlyStats.goalDone}/{monthlyStats.goal}
                  </div>
                </MetricRing>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <MiniStat label="Completed" value={monthlyStats.completed} />
                <MiniStat
                  label="Missed"
                  value={monthlyStats.missed}
                  tone="rose"
                />
                <MiniStat
                  label="Excused"
                  value={monthlyStats.excused}
                  tone="amber"
                />
                <MiniStat
                  label="Unlogged"
                  value={monthlyStats.unlogged}
                  tone="slate"
                />
                <MiniStat
                  label="Perfect"
                  value={monthlyStats.perfectDays}
                  detail="days"
                  tone="amber"
                />
                <MiniStat
                  label="Logged days"
                  value={monthlyStats.activeDays}
                  detail={`/ ${monthDays.length}`}
                  tone="sky"
                />
              </div>
            </div>
          </div>

          <StatusLegend />

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    30-day heatmap
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Tap a day to see each prayer status
                  </div>
                </div>
                <Badge tone="slate">{selectedDate}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {monthDays.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => onSelectDate(day.iso)}
                    aria-pressed={day.active}
                    title={`${day.label}: ${day.count}/5`}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center rounded-lg border text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20",
                      heatmapClass(day.count),
                      day.active && "ring-2 ring-emerald-500",
                      day.isToday && "border-emerald-400"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-70">
                      {day.weekday}
                    </span>
                    <span className="text-sm font-bold">{day.date}</span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {day.count}/5
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <SelectedDayPanel selectedDay={selectedDay} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  By prayer
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Completed / goal
                </div>
              </div>
              <Badge tone="emerald">{monthlyStats.percentage}% overall</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {prayerInsights.map((insight) => (
                <PrayerInsightRow key={insight.prayer} insight={insight} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const MetricRing: React.FC<{
  progress: number;
  children: React.ReactNode;
  sizeClassName?: string;
}> = ({ progress, children, sizeClassName = "h-32 w-32" }) => {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const degrees = Math.round(safeProgress * 360);

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full p-2",
        sizeClassName
      )}
      style={{
        background: `conic-gradient(#059669 ${degrees}deg, #dbeafe ${degrees}deg)`,
      }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-inner">
        <div>{children}</div>
      </div>
    </div>
  );
};

const InsightTile: React.FC<{
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "emerald" | "amber" | "sky" | "slate";
}> = ({ label, value, detail, tone = "slate" }) => (
  <div
    className={cn(
      "rounded-xl border p-3 shadow-sm shadow-slate-900/[0.02]",
      tone === "emerald" && "border-emerald-200 bg-emerald-50",
      tone === "amber" && "border-amber-200 bg-amber-50",
      tone === "sky" && "border-sky-200 bg-sky-50",
      tone === "slate" && "border-slate-200 bg-white"
    )}
  >
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    {detail ? <div className="mt-0.5 text-xs text-slate-500">{detail}</div> : null}
  </div>
);

const MiniStat: React.FC<{
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "emerald" | "amber" | "rose" | "sky" | "slate";
}> = ({ label, value, detail, tone = "emerald" }) => (
  <div
    className={cn(
      "rounded-lg border px-3 py-2",
      tone === "emerald" && "border-emerald-200 bg-emerald-50",
      tone === "amber" && "border-amber-200 bg-amber-50",
      tone === "rose" && "border-rose-200 bg-rose-50",
      tone === "sky" && "border-sky-200 bg-sky-50",
      tone === "slate" && "border-slate-200 bg-slate-50"
    )}
  >
    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-lg font-bold text-slate-950">{value}</span>
      {detail ? <span className="text-xs text-slate-500">{detail}</span> : null}
    </div>
  </div>
);

const StatusSegmentBar: React.FC<{
  completed: number;
  missed: number;
  excused: number;
  unlogged: number;
}> = ({ completed, missed, excused, unlogged }) => {
  const total = Math.max(completed + missed + excused + unlogged, 1);
  const segments = [
    { key: "completed", value: completed, className: "bg-emerald-500" },
    { key: "missed", value: missed, className: "bg-rose-500" },
    { key: "excused", value: excused, className: "bg-amber-400" },
    { key: "unlogged", value: unlogged, className: "bg-slate-300" },
  ];

  return (
    <div className="mt-4">
      <div className="flex h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 sm:grid-cols-4">
        <span>Completed {completed}</span>
        <span>Missed {missed}</span>
        <span>Excused {excused}</span>
        <span>Unlogged {unlogged}</span>
      </div>
    </div>
  );
};

const StatusLegend: React.FC = () => (
  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
    <StatusPill status="completed" />
    <StatusPill status="missed" />
    <StatusPill status="excused" />
    <StatusPill status={null} />
  </div>
);

const StatusPill: React.FC<{ status: SalahStatus | null }> = ({ status }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
    <span className={cn("h-2 w-2 rounded-full", statusDotClass(status))} />
    {statusLabel(status)}
  </span>
);

const SelectedDayPanel: React.FC<{ selectedDay: MonthDayInsight | null }> = ({
  selectedDay,
}) => {
  if (!selectedDay) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Select a day to inspect prayer status.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected day
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {selectedDay.label}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {selectedDay.count}/5 - {selectedDay.percentage}%
          </div>
        </div>
        <MetricRing
          progress={selectedDay.percentage / 100}
          sizeClassName="h-16 w-16"
        >
          <div className="text-lg font-bold text-slate-950">
            {selectedDay.count}
          </div>
        </MetricRing>
      </div>

      <div className="mt-4 space-y-2">
        {selectedDay.statuses.map((item) => (
          <div
            key={item.prayer}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-800">
              {PRAYER_LABELS[item.prayer]}
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", statusDotClass(item.status))}
              />
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrayerInsightRow: React.FC<{ insight: PrayerInsight }> = ({
  insight,
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <div className="text-sm font-semibold text-slate-900">
          {insight.label}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {insight.completed}/{insight.goal} completed
        </div>
      </div>
      <Badge tone={insight.percentage >= 80 ? "emerald" : "slate"}>
        {insight.percentage}%
      </Badge>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-emerald-500"
        style={{ width: `${insight.percentage}%` }}
      />
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:grid-cols-4">
      <span>Missed {insight.missed}</span>
      <span>Excused {insight.excused}</span>
      <span>Unlogged {insight.unlogged}</span>
      <span>Logged {insight.logged}</span>
    </div>
  </div>
);

const StatusCard: React.FC<{
  label: string;
  value: string;
  tone: "success" | "muted" | "info";
}> = ({ label, value, tone }) => {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm shadow-slate-900/[0.03] ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono = false }) => (
  <div>
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd
      className={`mt-1 break-words text-slate-800 ${
        mono ? "font-mono text-xs" : ""
      }`}
    >
      {value}
    </dd>
  </div>
);

function buildSalahInsights(
  logs: SalahLog[],
  selectedDate: string,
  todayIso: string,
  locale: string
): SalahInsights {
  const statusByDate = new Map<string, Map<PrayerName, SalahStatus>>();

  for (const log of logs) {
    const dateMap =
      statusByDate.get(log.prayer_date) ?? new Map<PrayerName, SalahStatus>();
    dateMap.set(log.prayer_name, log.status);
    statusByDate.set(log.prayer_date, dateMap);
  }

  const statusFor = (iso: string, prayer: PrayerName) =>
    statusByDate.get(iso)?.get(prayer) ?? null;

  const dayCompleted = (iso: string) =>
    PRAYER_ORDER.filter((prayer) => statusFor(iso, prayer) === "completed")
      .length;

  let streak = 0;
  let streakDay = todayIso;
  for (let i = 0; i < 60; i += 1) {
    if (dayCompleted(streakDay) >= PRAYER_ORDER.length) {
      streak += 1;
      streakDay = addDaysIso(streakDay, -1);
    } else {
      break;
    }
  }

  const weekDays: WeekDayInsight[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const iso = addDaysIso(todayIso, -i);
    const dt = parseDate(iso) ?? new Date();
    weekDays.push({
      iso,
      count: dayCompleted(iso),
      isToday: iso === todayIso,
      letter: dt
        .toLocaleDateString(locale, { weekday: "narrow" })
        .slice(0, 1),
    });
  }

  const monthDays: MonthDayInsight[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const iso = addDaysIso(todayIso, -i);
    const dt = parseDate(iso) ?? new Date();
    const statuses = PRAYER_ORDER.map((prayer) => ({
      prayer,
      status: statusFor(iso, prayer),
    }));
    const completed = statuses.filter(
      (item) => item.status === "completed"
    ).length;
    const missed = statuses.filter((item) => item.status === "missed").length;
    const excused = statuses.filter((item) => item.status === "excused").length;
    const logged = completed + missed + excused;

    monthDays.push({
      iso,
      count: completed,
      date: dt.getDate(),
      active: iso === selectedDate,
      isToday: iso === todayIso,
      weekday: dt
        .toLocaleDateString(locale, { weekday: "narrow" })
        .slice(0, 1),
      label: formatDetailDate(iso, locale),
      statuses,
      completed,
      missed,
      excused,
      logged,
      unlogged: Math.max(0, PRAYER_ORDER.length - logged),
      percentage: Math.round((completed / PRAYER_ORDER.length) * 100),
    });
  }

  const completed = monthDays.reduce((sum, day) => sum + day.completed, 0);
  const missed = monthDays.reduce((sum, day) => sum + day.missed, 0);
  const excused = monthDays.reduce((sum, day) => sum + day.excused, 0);
  const unlogged = monthDays.reduce((sum, day) => sum + day.unlogged, 0);
  const logged = completed + missed + excused;
  const goal = monthDays.length * PRAYER_ORDER.length;
  const goalDone = Math.min(completed, goal);
  const monthlyStats = {
    completed,
    missed,
    excused,
    unlogged,
    logged,
    goal,
    goalDone,
    percentage: goal > 0 ? Math.round((goalDone / goal) * 100) : 0,
    perfectDays: monthDays.filter((day) => day.count >= PRAYER_ORDER.length)
      .length,
    activeDays: monthDays.filter((day) => day.logged > 0).length,
  };

  const prayerInsights = PRAYER_ORDER.map((prayer) => {
    const statuses = monthDays.map(
      (day) =>
        day.statuses.find((item) => item.prayer === prayer)?.status ?? null
    );
    const prayerCompleted = statuses.filter(
      (status) => status === "completed"
    ).length;
    const prayerMissed = statuses.filter((status) => status === "missed")
      .length;
    const prayerExcused = statuses.filter((status) => status === "excused")
      .length;
    const prayerLogged = prayerCompleted + prayerMissed + prayerExcused;
    const prayerGoal = monthDays.length;

    return {
      prayer,
      label: PRAYER_LABELS[prayer],
      completed: prayerCompleted,
      missed: prayerMissed,
      excused: prayerExcused,
      logged: prayerLogged,
      unlogged: Math.max(0, prayerGoal - prayerLogged),
      goal: prayerGoal,
      percentage:
        prayerGoal > 0 ? Math.round((prayerCompleted / prayerGoal) * 100) : 0,
    };
  });

  const last7Completed = weekDays.reduce((sum, day) => sum + day.count, 0);
  const last7Goal = weekDays.length * PRAYER_ORDER.length;
  let bestStreak = 0;
  let currentRun = 0;
  for (const day of monthDays) {
    if (day.count >= PRAYER_ORDER.length) {
      currentRun += 1;
      bestStreak = Math.max(bestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }

  const bestDay = monthDays.reduce<MonthDayInsight | null>((best, day) => {
    if (!best || day.count > best.count) return day;
    return best;
  }, null);
  const today = monthDays.find((day) => day.isToday) ?? null;
  const selectedDay =
    monthDays.find((day) => day.iso === selectedDate) ??
    monthDays[monthDays.length - 1] ??
    null;

  return {
    streak,
    weekDays,
    monthDays,
    monthlyStats,
    prayerInsights,
    progressStats: {
      last7Completed,
      last7Goal,
      last7Percentage:
        last7Goal > 0 ? Math.round((last7Completed / last7Goal) * 100) : 0,
      bestStreak,
      bestDay,
      today,
    },
    selectedDay,
  };
}

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;
}

function addDaysIso(iso: string, days: number) {
  const date = parseDate(iso) ?? new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function parseDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDetailDate(iso: string, locale: string) {
  const date = parseDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function heatmapClass(count: number) {
  if (count >= 5) return "border-emerald-400 bg-emerald-100 text-emerald-950";
  if (count >= 3) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (count > 0) return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-slate-200 bg-white text-slate-500";
}

function statusDotClass(status: SalahStatus | null) {
  if (status === "completed") return "bg-emerald-500";
  if (status === "missed") return "bg-rose-500";
  if (status === "excused") return "bg-amber-400";
  return "bg-slate-300";
}

function statusLabel(status: SalahStatus | null) {
  if (status === "completed") return "Completed";
  if (status === "missed") return "Missed";
  if (status === "excused") return "Excused";
  return "Unlogged";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPlatform(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const platforms: Record<string, string> = {
    ios: "Apple App Store",
    android: "Google Play",
    admin: "Admin/manual",
    manual: "Manual",
  };
  return platforms[value] ?? humanize(value);
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function maskValue(value: string | null | undefined) {
  if (!value) return "Not recorded";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default AccountPage;
