import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";

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
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    });
    response.end();
    return;
  }

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

  sendJson(response, 200, {
    overview: overviewResult.data ?? null,
    masjidActiveUsers: masjidResult.data ?? [],
    pageTime: pageTimeResult.data ?? [],
    retention: retentionResult.data ?? [],
    dailyFrequency: frequencyResult.data ?? [],
  });
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
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}
