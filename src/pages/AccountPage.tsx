import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/authContext";
import { Alert, Badge, Button, Spinner } from "../components/ui";

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
  const assignedMasjidKey = accessiblePrayerMasjidIds.join("|");
  const assignedMasjidIds = useMemo(
    () => (assignedMasjidKey ? assignedMasjidKey.split("|") : []),
    [assignedMasjidKey]
  );
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [purchaseEvents, setPurchaseEvents] = useState<PurchaseEvent[]>([]);
  const [assignedMasjids, setAssignedMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const premiumQuery = supabase
      .from("user_premium_status")
      .select(
        "user_id, founding_supporter, lifetime_premium, platform, product_id, purchased_at, verified_at, revoked_at, has_lifetime_premium"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const eventsQuery = supabase
      .from("purchase_events")
      .select(
        "id, platform, product_id, transaction_id, original_transaction_id, event_type, status, created_at"
      )
      .eq("user_id", user.id)
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

    if (premiumResult.error) {
      setPremium(null);
      setError(premiumResult.error.message);
    } else {
      setPremium((premiumResult.data as PremiumStatus | null) ?? null);
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

    setLoading(false);
  }, [assignedMasjidIds, user?.id]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const hasPremium = Boolean(premium?.has_lifetime_premium);
  const isRevoked = Boolean(premium?.revoked_at);
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

      <section className={panelClass}>
        <div className={labelClass}>Purchase guidance</div>
        <div className="mt-4 grid gap-4 text-sm text-slate-600 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 leading-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={hasPremium && !isRevoked ? "emerald" : "slate"}>
                  {hasPremium && !isRevoked
                    ? "Entitlement active"
                    : "Not active"}
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
