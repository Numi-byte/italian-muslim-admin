import { createClient } from "https://esm.sh/@supabase/supabase-js@2.85.0";

const MAX_BODY_BYTES = 24 * 1024;
const DEFAULT_SUPPORT_EMAIL = "support@ummahway.com";
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TOPICS = new Set([
  "purchase",
  "login_access",
  "masjid_timings",
  "technical",
  "privacy",
  "other",
]);
const TOPIC_LABELS: Record<string, string> = {
  purchase: "Purchase or subscription",
  login_access: "Login or account access",
  masjid_timings: "Masjid or Jamaah timings",
  technical: "Technical issue",
  privacy: "Privacy or data request",
  other: "Other",
};
const TRUSTED_ORIGINS = new Set([
  "https://ummahway.com",
  "https://www.ummahway.com",
  "https://ummahway.eu",
  "https://www.ummahway.eu",
  "https://ummahway.co.uk",
  "https://www.ummahway.co.uk",
  "https://ummahway.de",
  "https://www.ummahway.de",
  "https://ummahway.nl",
  "https://www.ummahway.nl",
  "http://localhost:5173",
  "http://localhost:4173",
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
  status: "received" | "email_sent" | "email_failed" | "archived";
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const originAllowed = isTrustedOrigin(request);
  if (!originAllowed) {
    return json(request, 403, { error: "Origin is not allowed." });
  }

  if (request.method !== "POST") {
    return json(request, 405, { error: "Method not allowed." });
  }

  const config = serverConfig();
  if (!config) {
    return json(request, 500, {
      error:
        "Contact email is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL in Supabase Edge Function secrets.",
    });
  }

  const supabaseAdmin = createClient<Database>(
    config.supabaseUrl,
    config.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  let rawPayload: unknown;

  try {
    rawPayload = await readJsonBody(request);
  } catch (error) {
    return json(request, 400, {
      error: error instanceof Error ? error.message : "Invalid request body.",
    });
  }

  const botPayload = rawPayload as ContactPayload;
  if (typeof botPayload?.website === "string" && botPayload.website.trim()) {
    return json(request, 200, { ok: true });
  }

  const validation = sanitizeMessage(rawPayload, config.toEmail);
  if ("error" in validation) {
    return json(request, 400, { error: validation.error });
  }

  const userResult = await getAuthenticatedUser(supabaseAdmin, request, config);
  if ("error" in userResult) {
    return json(request, 401, { error: "Invalid account session." });
  }

  const ipAddress = getClientIp(request);
  const allowed = await checkRateLimit(
    supabaseAdmin,
    ipAddress,
    validation.message.contact_email,
  );

  if (!allowed) {
    return json(request, 429, {
      error: "Too many messages. Please try again later.",
    });
  }

  const insertPayload: SupportMessageInsert = {
    ...validation.message,
    user_id: userResult.user?.id ?? null,
    user_agent: request.headers.get("user-agent"),
    status: "received",
  };

  const { data: insertedMessage, error: insertError } = await supabaseAdmin
    .from("support_messages")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) {
    console.error("[support-contact] insert failed", insertError);
    return json(request, 500, { error: "Could not save your message." });
  }

  const messageId =
    typeof insertedMessage?.id === "string" ? insertedMessage.id : null;

  try {
    await sendContactEmails(config, validation.message, messageId);

    if (messageId) {
      await supabaseAdmin
        .from("support_messages")
        .update({ status: "email_sent" })
        .eq("id", messageId);
    }
  } catch (error) {
    console.error("[support-contact] email failed", error);

    if (messageId) {
      await supabaseAdmin
        .from("support_messages")
        .update({ status: "email_failed" })
        .eq("id", messageId);
    }

    return json(request, 502, { error: getEmailErrorMessage(error) });
  }

  return json(request, 200, { ok: true });
});

function serverConfig() {
  const secretKeys = safeJson<Record<string, string>>(
    Deno.env.get("SUPABASE_SECRET_KEYS"),
  );
  const supabaseUrl = cleanEnvValue(Deno.env.get("SUPABASE_URL"));
  const serviceRoleKey =
    cleanEnvValue(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ??
    cleanEnvValue(secretKeys?.default);
  const resendApiKey =
    cleanEnvValue(Deno.env.get("CONTACT_RESEND_API_KEY")) ??
    cleanEnvValue(Deno.env.get("RESEND_API_KEY"));
  const fromEmail =
    cleanEnvValue(Deno.env.get("CONTACT_FROM_EMAIL")) ??
    cleanEnvValue(Deno.env.get("RESEND_FROM_EMAIL"));
  const toEmail =
    cleanEnvValue(Deno.env.get("CONTACT_TO_EMAIL")) ??
    cleanEnvValue(Deno.env.get("SUPPORT_TO_EMAIL")) ??
    DEFAULT_SUPPORT_EMAIL;
  const anonKey = cleanEnvValue(Deno.env.get("SUPABASE_ANON_KEY"));

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail) return null;

  return { supabaseUrl, serviceRoleKey, resendApiKey, fromEmail, toEmail, anonKey };
}

async function readJsonBody(request: Request) {
  const body = await request.text();
  if (!body) throw new Error("Missing request body.");
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    throw new Error("Request body is too large.");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

function sanitizeMessage(payload: unknown, toEmail: string) {
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

  return {
    message: {
      recipient_email: toEmail,
      contact_name: contactName,
      contact_email: contactEmail,
      topic,
      subject,
      message,
      source,
      account_email: accountEmail,
      page_url: pageUrl,
    } satisfies SanitizedMessage,
  };
}

async function getAuthenticatedUser(
  supabaseAdmin: AdminClient,
  request: Request,
  config: NonNullable<ReturnType<typeof serverConfig>>,
) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === config.anonKey || token === config.serviceRoleKey) {
    return { user: null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error("[support-contact] invalid bearer token", error);
    return { error };
  }

  return { user: data.user };
}

function getEmailErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("domain") || lowerMessage.includes("verify")) {
    return "Email provider rejected the sender. Verify ummahway.com in Resend and set CONTACT_FROM_EMAIL to UmmahWay <support@ummahway.com>.";
  }

  if (lowerMessage.includes("api key") || lowerMessage.includes("unauthorized")) {
    return "Email provider rejected the API key. Check RESEND_API_KEY or CONTACT_RESEND_API_KEY in Supabase Edge Function secrets.";
  }

  return "Your message was saved, but email delivery failed. Check Supabase Edge Function logs and Resend sender setup.";
}

async function checkRateLimit(
  supabaseAdmin: AdminClient,
  ipAddress: string,
  email: string,
) {
  const checks = [
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "support_contact_ip",
      p_subject: ipAddress,
      p_max_attempts: 8,
      p_window_seconds: 3600,
    }),
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "support_contact_email",
      p_subject: email,
      p_max_attempts: 4,
      p_window_seconds: 86400,
    }),
  ];

  const results = await Promise.all(checks);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    console.error("[support-contact] rate limit failed", firstError);
    return false;
  }

  return results.every((result) => result.data === true);
}

async function sendContactEmails(
  config: NonNullable<ReturnType<typeof serverConfig>>,
  message: SanitizedMessage,
  messageId: string | null,
) {
  const internalEmail = buildInternalSupportEmail(message, messageId);
  const receiptEmail = buildUserReceiptEmail(message, messageId);

  await Promise.all([
    sendEmail(config, {
      to: message.recipient_email,
      replyTo: message.contact_email,
      subject: internalEmail.subject,
      text: internalEmail.text,
      html: internalEmail.html,
    }),
    sendEmail(config, {
      to: message.contact_email,
      replyTo: message.recipient_email,
      subject: receiptEmail.subject,
      text: receiptEmail.text,
      html: receiptEmail.html,
    }),
  ]);
}

async function sendEmail(
  config: NonNullable<ReturnType<typeof serverConfig>>,
  payload: {
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    html: string;
  },
) {
  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [payload.to],
      reply_to: payload.replyTo,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend email failed with ${response.status}: ${detail}`);
  }
}

function buildInternalSupportEmail(
  message: SanitizedMessage,
  messageId: string | null,
) {
  const topicLabel = getTopicLabel(message.topic);
  const subject = `[UmmahWay Contact] ${topicLabel}: ${message.subject}`;
  const reference = messageId ?? "not stored";
  const text = `New UmmahWay contact request

Reference: ${reference}
Topic: ${topicLabel}
Source: ${message.source}
Page URL: ${message.page_url ?? "N/A"}

From:
- Name: ${message.contact_name}
- Email: ${message.contact_email}
- Account email: ${message.account_email ?? "N/A"}

Subject:
${message.subject}

Message:
${message.message}

Reply directly to this email to respond to the user.`;

  const html = emailShell(`
    <h1 style="margin: 0; font-size: 22px; color: #14532d;">New contact request</h1>
    <p style="margin: 8px 0 24px; color: #52616b; font-size: 15px; line-height: 1.6;">
      A user submitted a message through UmmahWay.
    </p>

    ${detailTable([
      ["Reference", reference],
      ["Topic", topicLabel],
      ["Source", message.source],
      ["Name", message.contact_name],
      ["Email", message.contact_email],
      ["Account email", message.account_email ?? "N/A"],
      ["Page URL", message.page_url ?? "N/A"],
      ["Subject", message.subject],
    ])}

    <div style="margin-top: 22px;">
      <p style="margin: 0 0 8px; color: #14532d; font-size: 14px; font-weight: 700;">Message</p>
      <div style="white-space: pre-wrap; background: #f6f7f4; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; color: #1f2933; font-size: 15px; line-height: 1.6;">${escapeHtml(message.message)}</div>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 24px 0 0;">
      Reply directly to this email to respond to the user.
    </p>
  `);

  return { subject, text, html };
}

function buildUserReceiptEmail(
  message: SanitizedMessage,
  messageId: string | null,
) {
  const topicLabel = getTopicLabel(message.topic);
  const reference = messageId ?? "pending";
  const subject = "We received your UmmahWay support request";
  const text = `Assalamu alaykum ${message.contact_name},

We received your UmmahWay support request.

Reference: ${reference}
Topic: ${topicLabel}
Subject: ${message.subject}

Our team will review your message and reply to ${message.contact_email}.

Your message:
${message.message}

If you did not submit this request, you can ignore this email.`;

  const html = emailShell(`
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 24px; color: #14532d;">
        We received your request
      </h1>
      <p style="margin: 8px 0 0; color: #52616b; font-size: 15px; line-height: 1.6;">
        Thank you for contacting UmmahWay. Our team will review your message and reply by email.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Assalamu alaykum ${escapeHtml(message.contact_name)},
    </p>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Your message has been submitted successfully. Please keep this receipt for your records.
    </p>

    ${detailTable([
      ["Reference", reference],
      ["Topic", topicLabel],
      ["Subject", message.subject],
      ["Reply email", message.contact_email],
    ])}

    <div style="margin-top: 22px;">
      <p style="margin: 0 0 8px; color: #14532d; font-size: 14px; font-weight: 700;">Your message</p>
      <div style="white-space: pre-wrap; background: #f6f7f4; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; color: #1f2933; font-size: 15px; line-height: 1.6;">${escapeHtml(message.message)}</div>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

    <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 0;">
      If you did not submit this request, you can safely ignore this email.
    </p>
  `);

  return { subject, text, html };
}

function emailShell(content: string) {
  return `<div style="font-family: Arial, sans-serif; background-color: #f6f7f4; padding: 32px 16px; color: #1f2933;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #14532d; color: #ffffff; border-radius: 14px; padding: 10px 14px; font-size: 18px; font-weight: 700;">
        UmmahWay
      </div>
    </div>
    ${content}
  </div>
</div>`;
}

function detailTable(rows: Array<[string, string]>) {
  return `<table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden;">
    <tbody>
      ${rows
        .map(
          ([label, value]) => `<tr>
            <td style="width: 34%; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; background: #f6f7f4; color: #52616b; font-size: 13px; font-weight: 700;">${escapeHtml(label)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2933; font-size: 14px; line-height: 1.5;">${escapeHtml(value)}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
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

function getTopicLabel(topic: string) {
  return TOPIC_LABELS[topic] ?? topic;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (TRUSTED_ORIGINS.has(origin)) return true;

  const extraOrigins = (
    Deno.env.get("CONTACT_ALLOWED_ORIGINS") ??
    Deno.env.get("ALLOWED_ORIGINS") ??
    ""
  )
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return extraOrigins.includes(origin.replace(/\/$/, ""));
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowOrigin = origin && isTrustedOrigin(request) ? origin : "https://ummahway.com";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers":
      "authorization, x-client-info, apikey, content-type",
    "access-control-max-age": "600",
    vary: "Origin",
    ...securityHeaders(),
  };
}

function securityHeaders() {
  return {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-robots-tag": "noindex, nofollow",
  };
}

function json(request: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request),
  });
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function safeJson<T>(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
