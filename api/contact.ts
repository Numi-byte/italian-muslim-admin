import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  firstHeaderValue,
  handleCorsPreflight,
  requireTrustedOrigin,
  setApiSecurityHeaders,
  setNoStore,
} from "./_security";
import {
  EmailConfigurationError,
  escapeHtml,
  getSupportRecipientEmail,
  sendEmail,
} from "./_email";

const MAX_BODY_BYTES = 24 * 1024;
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

type SupportMessageStatus = "received" | "email_sent" | "email_failed" | "archived";

type SupportMessageInsert = SanitizedMessage & {
  user_id: string | null;
  user_agent: string | null;
  status: SupportMessageStatus;
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
  setApiSecurityHeaders(response);

  if (request.method === "OPTIONS") {
    handleCorsPreflight(request, response, {
      methods: "POST, OPTIONS",
      headers: "Content-Type, Authorization",
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

  const { data: insertedMessage, error } = await supabaseAdmin
    .from("support_messages")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[Contact API] Insert failed", error);
    sendJson(response, 500, { error: "Could not save your message." });
    return;
  }

  const messageId =
    typeof insertedMessage?.id === "string" ? insertedMessage.id : null;

  try {
    await sendContactEmails(validation.message, messageId);

    if (messageId) {
      await supabaseAdmin
        .from("support_messages")
        .update({ status: "email_sent" })
        .eq("id", messageId);
    }
  } catch (emailError) {
    console.error("[Contact API] Email delivery failed", emailError);

    if (messageId) {
      await supabaseAdmin
        .from("support_messages")
        .update({ status: "email_failed" })
        .eq("id", messageId);
    }

    sendJson(response, emailError instanceof EmailConfigurationError ? 500 : 502, {
      error:
        emailError instanceof EmailConfigurationError
          ? "Contact email is not configured."
          : "Your message was saved, but email delivery failed. Please try again later.",
    });
    return;
  }

  sendJson(response, 200, { ok: true });
}

async function sendContactEmails(
  message: SanitizedMessage,
  messageId: string | null
) {
  const internalEmail = buildInternalSupportEmail(message, messageId);
  const receiptEmail = buildUserReceiptEmail(message, messageId);

  await Promise.all([
    sendEmail({
      to: message.recipient_email,
      replyTo: message.contact_email,
      subject: internalEmail.subject,
      text: internalEmail.text,
      html: internalEmail.html,
    }),
    sendEmail({
      to: message.contact_email,
      replyTo: message.recipient_email,
      subject: receiptEmail.subject,
      text: receiptEmail.text,
      html: receiptEmail.html,
    }),
  ]);
}

function buildInternalSupportEmail(
  message: SanitizedMessage,
  messageId: string | null
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
      <div style="white-space: pre-wrap; background: #f6f7f4; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; color: #1f2933; font-size: 15px; line-height: 1.6;">${escapeHtml(
        message.message
      )}</div>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 24px 0 0;">
      Reply directly to this email to respond to the user.
    </p>
  `);

  return { subject, text, html };
}

function buildUserReceiptEmail(
  message: SanitizedMessage,
  messageId: string | null
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
      <div style="white-space: pre-wrap; background: #f6f7f4; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; color: #1f2933; font-size: 15px; line-height: 1.6;">${escapeHtml(
        message.message
      )}</div>
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
            <td style="width: 34%; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; background: #f6f7f4; color: #52616b; font-size: 13px; font-weight: 700;">${escapeHtml(
              label
            )}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2933; font-size: 14px; line-height: 1.5;">${escapeHtml(
              value
            )}</td>
          </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
}

function getTopicLabel(topic: string) {
  return TOPIC_LABELS[topic] ?? topic;
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
    recipient_email: getSupportRecipientEmail(),
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
