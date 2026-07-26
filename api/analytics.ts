import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  handleCorsPreflight,
  requireTrustedOrigin,
  setApiSecurityHeaders,
  setNoStore,
} from "./_security.js";

const SUPER_ADMIN_USER_ID = "e4d243f9-9b01-42d4-8dec-f1826bfe74ca";

type AdminClient = ReturnType<typeof createClient>;

let adminClient: AdminClient | null = null;

function getAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = cleanEnvValue(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  );
  const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    new URL(supabaseUrl);

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error("[Analytics API] Invalid Supabase server env", error);
    return null;
  }

  return adminClient;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  setApiSecurityHeaders(response);

  if (request.method === "OPTIONS") {
    handleCorsPreflight(request, response, {
      methods: "GET, OPTIONS",
      headers: "Authorization, Content-Type",
    });
    return;
  }

  if (!requireTrustedOrigin(request, response)) return;

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const supabaseAdmin = getAdminClient();

  if (!supabaseAdmin) {
    sendJson(response, 500, {
      error:
        "Analytics API is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
    });
    return;
  }

  const token = getBearerToken(request.headers.authorization);
  if (!token) {
    sendJson(response, 401, { error: "Missing admin session." });
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    console.error("[Analytics API] Invalid admin session", userError);
    sendJson(response, 401, {
      error:
        userError?.message ??
        "Invalid admin session. Sign out and sign back in, then try again.",
    });
    return;
  }

  const isAdmin = await userIsAdmin(supabaseAdmin, user.id);
  if (!isAdmin) {
    sendJson(response, 403, { error: "Admin access required." });
    return;
  }

  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    overviewResult,
    masjidResult,
    pageTimeResult,
    retentionResult,
    frequencyResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("analytics_live_overview")
      .select(
        "total_downloaded_installations, installed_now, inferred_uninstalled, active_installations_24h, active_signed_masjid_users_24h, sessions_today, avg_session_seconds_today, generated_at"
      )
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("analytics_masjid_active_users")
      .select(
        "current_masjid_id, masjid_name, city, active_signed_users_24h, active_signed_users_7d, active_installations_7d"
      )
      .order("active_signed_users_24h", { ascending: false }),
    supabaseAdmin
      .from("analytics_page_time")
      .select(
        "page_path, views, unique_installations, total_seconds, avg_seconds, last_viewed_at"
      )
      .order("total_seconds", { ascending: false }),
    supabaseAdmin
      .from("analytics_daily_retention")
      .select(
        "install_date, downloaded_installations, retained_day_1, retained_day_7, retained_day_30, inferred_uninstalled, average_days_installed:avg_days_installed"
      )
      .order("install_date", { ascending: true }),
    supabaseAdmin
      .from("analytics_daily_frequency")
      .select(
        "date:usage_date, app_opens, active_installations, opens_per_active_installation, average_session_seconds:avg_session_seconds"
      )
      .order("usage_date", { ascending: true }),
  ]);

  const firstError =
    overviewResult.error ??
    masjidResult.error ??
    pageTimeResult.error ??
    retentionResult.error ??
    frequencyResult.error;

  if (firstError) {
    console.error("[Analytics API] Supabase query failed", firstError);
    sendJson(response, 500, { error: "Analytics query failed." });
    return;
  }

  const [
    audienceOverviewResult,
    ageBandResult,
    languageResult,
    roleResult,
    audienceMasjidResult,
    profileRows,
    installationRows,
    premiumRows,
    masjidFollowers,
    salahLogsTotal,
    salahLogs7d,
    duaJournalEntries,
    duaFavorites,
    foundingWallEntries,
  ] = await Promise.all([
    supabaseAdmin
      .from("im_analytics_overview")
      .select(
        "total_profiles, masjid_count, push_opt_in_count, marketing_opt_in_count"
      )
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("im_analytics_by_age_band")
      .select("age_band, profile_count"),
    supabaseAdmin
      .from("im_analytics_by_app_language")
      .select("app_language, profile_count")
      .order("profile_count", { ascending: false }),
    supabaseAdmin
      .from("im_analytics_by_role")
      .select("user_role, profile_count")
      .order("profile_count", { ascending: false }),
    supabaseAdmin
      .from("im_analytics_by_masjid")
      .select("masjid_id, masjid_name, city, profile_count")
      .order("profile_count", { ascending: false }),
    fetchAllRows<ProfileRow>(
      supabaseAdmin,
      "im_user_profiles",
      "gender, user_id, upgraded_from_guest"
    ),
    fetchAllRows<InstallationRow>(
      supabaseAdmin,
      "app_installations",
      "platform, app_version, is_uninstalled"
    ),
    fetchAllRows<PremiumRow>(
      supabaseAdmin,
      "user_premium_status",
      "founding_supporter, lifetime_premium, revoked_at"
    ),
    countRows(supabaseAdmin, "masjid_followers"),
    countRows(supabaseAdmin, "salah_logs"),
    countRows(supabaseAdmin, "salah_logs", (query) =>
      query.gte("prayer_date", sevenDaysAgoDate)
    ),
    countRows(supabaseAdmin, "dua_journal"),
    countRows(supabaseAdmin, "dua_favorites"),
    countRows(supabaseAdmin, "founding_wall_entries"),
  ]);

  const byGender = tally(profileRows, (row) => row.gender ?? "unknown");
  const registeredProfiles = profileRows.filter((row) => row.user_id).length;
  const byPlatform = tallyInstallations(
    installationRows,
    (row) => row.platform ?? "unknown"
  );
  const byVersion = tallyInstallations(
    installationRows,
    (row) => row.app_version ?? "unknown"
  );
  const activePremium = premiumRows.filter((row) => !row.revoked_at);

  sendJson(response, 200, {
    overview: overviewResult.data ?? null,
    masjidActiveUsers: masjidResult.data ?? [],
    pageTime: pageTimeResult.data ?? [],
    retention: retentionResult.data ?? [],
    dailyFrequency: frequencyResult.data ?? [],
    audience: {
      overview: audienceOverviewResult.error
        ? null
        : audienceOverviewResult.data ?? null,
      byAgeBand: ageBandResult.data ?? [],
      byLanguage: languageResult.data ?? [],
      byRole: roleResult.data ?? [],
      byMasjid: audienceMasjidResult.data ?? [],
      byGender,
      totalProfiles: profileRows.length,
      registeredProfiles,
      guestProfiles: profileRows.length - registeredProfiles,
      upgradedFromGuest: profileRows.filter((row) => row.upgraded_from_guest)
        .length,
    },
    devices: {
      byPlatform,
      byVersion,
    },
    engagement: {
      masjidFollowers,
      salahLogsTotal,
      salahLogs7d,
      duaJournalEntries,
      duaFavorites,
      foundingWallEntries,
      foundingSupporters: activePremium.filter((row) => row.founding_supporter)
        .length,
      lifetimePremium: activePremium.filter((row) => row.lifetime_premium)
        .length,
    },
  });
}

type ProfileRow = {
  gender: string | null;
  user_id: string | null;
  upgraded_from_guest: boolean | null;
};

type InstallationRow = {
  platform: string | null;
  app_version: string | null;
  is_uninstalled: boolean | null;
};

type PremiumRow = {
  founding_supporter: boolean | null;
  lifetime_premium: boolean | null;
  revoked_at: string | null;
};

/** Fetch every row of a small table in 1000-row pages (fail-soft: [] on error). */
async function fetchAllRows<T>(
  supabaseAdmin: AdminClient,
  table: string,
  columns: string,
  cap = 20000
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; from < cap; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`[Analytics API] ${table} fetch failed`, error);
      return rows;
    }

    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

type CountQuery = ReturnType<ReturnType<AdminClient["from"]>["select"]>;

/** Exact row count (fail-soft: null on error so one missing table cannot break the page). */
async function countRows(
  supabaseAdmin: AdminClient,
  table: string,
  applyFilter?: (query: CountQuery) => CountQuery
): Promise<number | null> {
  let query = supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  if (applyFilter) {
    query = applyFilter(query);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`[Analytics API] ${table} count failed`, error);
    return null;
  }

  return count ?? 0;
}

function tally<T>(rows: T[], keyOf: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function tallyInstallations(
  rows: InstallationRow[],
  keyOf: (row: InstallationRow) => string
) {
  const counts = new Map<
    string,
    { label: string; installations: number; installedNow: number }
  >();

  for (const row of rows) {
    const key = keyOf(row);
    const entry = counts.get(key) ?? {
      label: key,
      installations: 0,
      installedNow: 0,
    };
    entry.installations += 1;
    if (!row.is_uninstalled) entry.installedNow += 1;
    counts.set(key, entry);
  }

  return Array.from(counts.values()).sort(
    (a, b) => b.installations - a.installations
  );
}

async function userIsAdmin(supabaseAdmin: AdminClient, userId: string) {
  if (userId === SUPER_ADMIN_USER_ID) return true;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Analytics API] Profile lookup failed", error);
    return false;
  }

  const profile = data as { role: string | null } | null;
  return profile?.role === "super_admin";
}

function getBearerToken(authorizationHeader: string | string[] | undefined) {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>
) {
  setApiSecurityHeaders(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  setNoStore(response);
  response.end(JSON.stringify(payload));
}
