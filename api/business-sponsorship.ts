import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  firstHeaderValue,
  handleCorsPreflight,
  requireTrustedOrigin,
  setApiSecurityHeaders,
  setNoStore,
} from "./_security";

const MAX_BODY_BYTES = 32 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SponsorshipPayload = {
  business_name?: unknown;
  contact_name?: unknown;
  contact_email?: unknown;
  contact_phone?: unknown;
  city?: unknown;
  website_url?: unknown;
  business_type?: unknown;
  target_audience?: unknown;
  offer_type?: unknown;
  budget_range?: unknown;
  preferred_duration?: unknown;
  notes?: unknown;
};

type SanitizedApplication = {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  website_url: string | null;
  business_type: string;
  target_audience: string;
  offer_type: string;
  budget_range: string;
  preferred_duration: string;
  notes: string | null;
  source: "website";
  status: "new";
};

type Database = {
  public: {
    Tables: {
      business_sponsorship_applications: {
        Row: SanitizedApplication & { id: string };
        Insert: SanitizedApplication;
        Update: Partial<SanitizedApplication>;
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
    console.error("[Sponsorship API] Invalid Supabase server env", error);
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
      methods: "POST, OPTIONS",
      headers: "Content-Type",
    });
    return;
  }

  if (!requireTrustedOrigin(request, response)) return;

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    sendJson(response, 500, { error: "Sponsorship API is not configured." });
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

  const validation = sanitizeApplication(rawPayload);
  if ("error" in validation) {
    sendJson(response, 400, { error: validation.error });
    return;
  }

  const ipAddress = getClientIp(request);
  const rateLimitAllowed = await checkRateLimit(
    supabaseAdmin,
    ipAddress,
    validation.application.contact_email
  );

  if (!rateLimitAllowed) {
    sendJson(response, 429, {
      error: "Too many sponsorship submissions. Please try again later.",
    });
    return;
  }

  const { error } = await supabaseAdmin
    .from("business_sponsorship_applications")
    .insert(validation.application)
    .select("id")
    .single();

  if (error) {
    console.error("[Sponsorship API] Insert failed", error);
    sendJson(response, 500, { error: "Could not submit application." });
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

function sanitizeApplication(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid sponsorship application." };
  }

  const input = payload as SponsorshipPayload;
  const businessName = requiredText(input.business_name, 180);
  const contactName = requiredText(input.contact_name, 180);
  const contactEmail = requiredText(input.contact_email, 320).toLowerCase();
  const contactPhone = requiredText(input.contact_phone, 80);
  const city = requiredText(input.city, 180);
  const businessType = requiredText(input.business_type, 180);
  const targetAudience = requiredText(input.target_audience, 180);
  const offerType = requiredText(input.offer_type, 180);
  const budgetRange = requiredText(input.budget_range, 120);
  const preferredDuration = requiredText(input.preferred_duration, 120);

  if (
    !businessName ||
    !contactName ||
    !contactEmail ||
    !contactPhone ||
    !city ||
    !businessType ||
    !targetAudience ||
    !offerType ||
    !budgetRange ||
    !preferredDuration
  ) {
    return { error: "Please complete all required fields." };
  }

  if (!EMAIL_PATTERN.test(contactEmail)) {
    return { error: "Please enter a valid email address." };
  }

  const websiteUrl = optionalUrl(input.website_url, 500);
  if (websiteUrl === false) {
    return { error: "Website must be a valid http or https URL." };
  }

  const application: SanitizedApplication = {
    business_name: businessName,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    city,
    website_url: websiteUrl,
    business_type: businessType,
    target_audience: targetAudience,
    offer_type: offerType,
    budget_range: budgetRange,
    preferred_duration: preferredDuration,
    notes: optionalText(input.notes, 3000),
    source: "website",
    status: "new",
  };

  return { application };
}

function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function optionalText(value: unknown, maxLength: number) {
  const text = requiredText(value, maxLength);
  return text || null;
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

async function checkRateLimit(
  supabaseAdmin: AdminClient,
  ipAddress: string,
  email: string
) {
  const checks = [
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_sponsorship_ip",
      p_subject: ipAddress,
      p_max_attempts: 5,
      p_window_seconds: 3600,
    }),
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_sponsorship_email",
      p_subject: email,
      p_max_attempts: 3,
      p_window_seconds: 86400,
    }),
  ];

  const results = await Promise.all(checks);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    console.error("[Sponsorship API] Rate limit check failed", firstError);
    return false;
  }

  return results.every((result) => result.data === true);
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = firstHeaderValue(request.headers["x-forwarded-for"]);
  const realIp = firstHeaderValue(request.headers["x-real-ip"]);
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || realIp || request.socket.remoteAddress || "unknown";
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
