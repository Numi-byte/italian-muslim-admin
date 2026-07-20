import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";

const MAX_BODY_BYTES = 24 * 1024;
const SUPPORT_TO_EMAIL = "support@ummahway.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TOPICS = new Set([
  "purchase",
  "login_access",
  "masjid_timings",
  "technical",
  "privacy",
  "other",
]);

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  subject?: unknown;
  message?: unknown;
  source?: unknown;
  account_email?: unknown;
  page_url?: unknown;
  website?: unknown;
};

type SanitizedMessage = {
  recipient_email: string;
  contact_name: string;
  contact_email: string;
  topic: string;
  subject: string;
  message: string;
  source: string;
  account_email: string | null;
  page_url: string | null;
};

type SupportMessageInsert = SanitizedMessage & {
  user_id: string | null;
  user_agent: string | null;
  status: "received";
};

type Database = {
  public: {
    Tables: {
      support_messages: {
        Row: SupportMessageInsert & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: SupportMessageInsert;
        Update: Partial<SupportMessageInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_edge_rate_limit: {
        Args: {
          p_scope: string;
          p_subject: string;
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
    };
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
    console.error("[Contact API] Invalid Supabase server env", error);
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    sendJson(response, 500, { error: "Contact API is not configured." });
    return;
  }

  let rawPayload: unknown;

  try {
    rawPayload = await readJsonBody(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request body.";
    sendJson(response, 400, { error: message });
    return;
  }

  const botPayload = rawPayload as ContactPayload;
  if (typeof botPayload?.website === "string" && botPayload.website.trim()) {
    sendJson(response, 200, { ok: true });
    return;
  }

  const validation = sanitizeMessage(rawPayload);
  if ("error" in validation) {
    sendJson(response, 400, { error: validation.error });
    return;
  }

  const userResult = await getAuthenticatedUser(supabaseAdmin, request);
  if ("error" in userResult) {
    sendJson(response, 401, { error: "Invalid account session." });
    return;
  }

  const ipAddress = getClientIp(request);
  const rateLimitAllowed = await checkRateLimit(
    supabaseAdmin,
    ipAddress,
    validation.message.contact_email
  );

  if (!rateLimitAllowed) {
    sendJson(response, 429, {
      error: "Too many messages. Please try again later.",
    });
    return;
  }

  const insertPayload: SupportMessageInsert = {
    ...validation.message,
    user_id: userResult.user?.id ?? null,
    user_agent: firstHeaderValue(request.headers["user-agent"]) ?? null,
    status: "received",
  };

  const { error } = await supabaseAdmin
    .from("support_messages")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[Contact API] Insert failed", error);
    sendJson(response, 500, { error: "Could not save your message." });
    return;
  }

  sendJson(response, 200, { ok: true });
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) throw new Error("Missing request body.");

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

function sanitizeMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid contact message." };
  }

  const input = payload as ContactPayload;
  const contactName = requiredText(input.name, 120);
  const contactEmail = requiredText(input.email, 320).toLowerCase();
  const topic = requiredText(input.topic, 80);
  const subject = requiredText(input.subject, 160);
  const message = requiredText(input.message, 5000);
  const source = optionalText(input.source, 80) ?? "web";
  const accountEmail = optionalEmail(input.account_email);
  const pageUrl = optionalUrl(input.page_url, 500);

  if (!contactName || !contactEmail || !topic || !subject || !message) {
    return { error: "Please complete all required fields." };
  }

  if (!EMAIL_PATTERN.test(contactEmail)) {
    return { error: "Please enter a valid email address." };
  }

  if (!VALID_TOPICS.has(topic)) {
    return { error: "Please choose a valid topic." };
  }

  if (pageUrl === false) {
    return { error: "Page URL is invalid." };
  }

  const contactMessage: SanitizedMessage = {
    recipient_email: SUPPORT_TO_EMAIL,
    contact_name: contactName,
    contact_email: contactEmail,
    topic,
    subject,
    message,
    source,
    account_email: accountEmail,
    page_url: pageUrl,
  };

  return { message: contactMessage };
}

function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function optionalText(value: unknown, maxLength: number) {
  const text = requiredText(value, maxLength);
  return text || null;
}

function optionalEmail(value: unknown) {
  const email = requiredText(value, 320).toLowerCase();
  if (!email) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

function optionalUrl(value: unknown, maxLength: number) {
  const text = requiredText(value, maxLength);
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return url.toString();
  } catch {
    return false;
  }
}

async function getAuthenticatedUser(
  supabaseAdmin: AdminClient,
  request: IncomingMessage
) {
  const token = getBearerToken(request.headers.authorization);
  if (!token) return { user: null };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error("[Contact API] Invalid bearer token", error);
    return { error };
  }

  return { user: data.user };
}

async function checkRateLimit(
  supabaseAdmin: AdminClient,
  ipAddress: string,
  email: string
) {
  const checks = [
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_contact_ip",
      p_subject: ipAddress,
      p_max_attempts: 8,
      p_window_seconds: 3600,
    }),
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_contact_email",
      p_subject: email,
      p_max_attempts: 4,
      p_window_seconds: 86400,
    }),
  ];

  const results = await Promise.all(checks);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    console.error("[Contact API] Rate limit check failed", firstError);
    return false;
  }

  return results.every((result) => result.data === true);
}

function getBearerToken(authorizationHeader: string | string[] | undefined) {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = firstHeaderValue(request.headers["x-forwarded-for"]);
  const realIp = firstHeaderValue(request.headers["x-real-ip"]);
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || realIp || request.socket.remoteAddress || "unknown";
}

function firstHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
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
