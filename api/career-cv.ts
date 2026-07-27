import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  firstHeaderValue,
  handleCorsPreflight,
  requireTrustedOrigin,
  setApiSecurityHeaders,
  setNoStore,
} from "./_security.js";

const SUPER_ADMIN_USER_ID = "e4d243f9-9b01-42d4-8dec-f1826bfe74ca";

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      career_applications: {
        Row: {
          id: string;
          cv_file_path: string;
          cv_file_name: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type AdminClient = ReturnType<typeof createClient<Database>>;

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

    adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error("[Career CV API] Invalid Supabase server env", error);
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
      headers: "Authorization",
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
    sendJson(response, 500, { error: "Career CV API is not configured." });
    return;
  }

  const adminUser = await requireSuperAdmin(supabaseAdmin, request);
  if ("error" in adminUser) {
    sendJson(response, adminUser.status, { error: adminUser.error });
    return;
  }

  const url = new URL(request.url ?? "/", getRequestOrigin(request));
  const applicationId = url.searchParams.get("application_id")?.trim() ?? "";

  if (!applicationId) {
    sendJson(response, 400, { error: "Missing application id." });
    return;
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from("career_applications")
    .select("id, cv_file_path, cv_file_name")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    console.error("[Career CV API] Application lookup failed", applicationError);
    sendJson(response, 404, { error: "Application was not found." });
    return;
  }

  const { data, error } = await supabaseAdmin.storage
    .from("career-cvs")
    .createSignedUrl(application.cv_file_path, 120, {
      download: application.cv_file_name,
    });

  if (error || !data?.signedUrl) {
    console.error("[Career CV API] Signed URL failed", error);
    sendJson(response, 500, { error: "Could not open this CV." });
    return;
  }

  sendJson(response, 200, { url: data.signedUrl });
}

async function requireSuperAdmin(
  supabaseAdmin: AdminClient,
  request: IncomingMessage
) {
  const token = getBearerToken(request.headers.authorization);
  if (!token) {
    return { status: 401, error: "Missing admin session." };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(
    token
  );
  const user = userData.user;

  if (userError || !user) {
    console.error("[Career CV API] Invalid bearer token", userError);
    return { status: 401, error: "Invalid admin session." };
  }

  if (user.id === SUPER_ADMIN_USER_ID) {
    return { userId: user.id };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[Career CV API] Profile lookup failed", profileError);
    return { status: 403, error: "Could not verify admin permissions." };
  }

  if (profile?.role !== "super_admin") {
    return { status: 403, error: "Only a super admin can open CVs." };
  }

  return { userId: user.id };
}

function getBearerToken(authorizationHeader: string | string[] | undefined) {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getRequestOrigin(request: IncomingMessage) {
  const forwardedProto = firstHeaderValue(request.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeaderValue(request.headers["x-forwarded-host"]);
  const host = forwardedHost || firstHeaderValue(request.headers.host) || "ummahway.com";
  const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`.replace(/\/$/, "");
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
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
