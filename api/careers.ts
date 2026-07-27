import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  firstHeaderValue,
  handleCorsPreflight,
  requireTrustedOrigin,
  setApiSecurityHeaders,
  setNoStore,
} from "./_security.js";
import {
  EmailConfigurationError,
  getSupportRecipientEmail,
  sendEmail,
} from "./_email.js";
import {
  buildCareerInternalSubmissionEmail,
  buildCareerReceiptEmail,
  type CareerApplicationEmailInfo,
  type CareerRoleEmailInfo,
} from "./_careerEmail.js";

const MAX_BODY_BYTES = 9 * 1024 * 1024;
const MAX_CV_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const CV_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

type CareerPayload = {
  role_id?: unknown;
  applicant_name?: unknown;
  applicant_email?: unknown;
  applicant_phone?: unknown;
  applicant_location?: unknown;
  linkedin_url?: unknown;
  portfolio_url?: unknown;
  current_company?: unknown;
  years_experience?: unknown;
  availability?: unknown;
  work_authorization?: unknown;
  salary_expectation?: unknown;
  cover_message?: unknown;
  consent_privacy?: unknown;
  consent_contact?: unknown;
  cv_file?: unknown;
  website?: unknown;
};

type CvPayload = {
  name?: unknown;
  type?: unknown;
  size?: unknown;
  base64?: unknown;
};

type SanitizedApplication = {
  role_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_location: string;
  linkedin_url: string | null;
  portfolio_url: string | null;
  current_company: string | null;
  years_experience: string | null;
  availability: string;
  work_authorization: string;
  salary_expectation: string | null;
  cover_message: string;
  source: "website";
  status: "submitted";
  consent_privacy: true;
  consent_contact: true;
};

type SanitizedCv = {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

type CareerRoleRow = CareerRoleEmailInfo & {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  closes_at: string | null;
};

type CareerApplicationInsert = SanitizedApplication & {
  role_title_snapshot: string;
  cv_file_name: string;
  cv_file_path: string;
  cv_file_type: string;
  cv_file_size: number;
  user_agent: string | null;
  notification_status: "received" | "email_sent" | "email_failed";
  notification_sent_at?: string;
  notification_error?: string;
  receipt_sent_at?: string;
  receipt_error?: string;
};

type Database = {
  public: {
    Tables: {
      career_roles: {
        Row: CareerRoleRow;
        Insert: Partial<CareerRoleRow>;
        Update: Partial<CareerRoleRow>;
        Relationships: [];
      };
      career_applications: {
        Row: CareerApplicationInsert & {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: CareerApplicationInsert;
        Update: Partial<CareerApplicationInsert>;
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
    console.error("[Careers API] Invalid Supabase server env", error);
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
    sendJson(response, 500, { error: "Careers API is not configured." });
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

  const botPayload = rawPayload as CareerPayload;
  if (typeof botPayload?.website === "string" && botPayload.website.trim()) {
    sendJson(response, 200, { ok: true });
    return;
  }

  const validation = sanitizeApplication(rawPayload);
  if ("error" in validation) {
    sendJson(response, 400, { error: validation.error });
    return;
  }

  const roleResult = await loadOpenRole(
    supabaseAdmin,
    validation.application.role_id
  );
  if ("error" in roleResult) {
    sendJson(response, 400, { error: roleResult.error });
    return;
  }

  const ipAddress = getClientIp(request);
  const rateLimitAllowed = await checkRateLimit(
    supabaseAdmin,
    ipAddress,
    validation.application.applicant_email
  );

  if (!rateLimitAllowed) {
    sendJson(response, 429, {
      error: "Too many career submissions. Please try again later.",
    });
    return;
  }

  const cvPath = buildCvPath(
    validation.application.applicant_email,
    validation.cv.fileName,
    validation.cv.mimeType
  );

  const { error: uploadError } = await supabaseAdmin.storage
    .from("career-cvs")
    .upload(cvPath, validation.cv.buffer, {
      contentType: validation.cv.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[Careers API] CV upload failed", uploadError);
    sendJson(response, 500, { error: "Could not upload your CV." });
    return;
  }

  const insertPayload: CareerApplicationInsert = {
    ...validation.application,
    role_title_snapshot: roleResult.role.title,
    cv_file_name: validation.cv.fileName,
    cv_file_path: cvPath,
    cv_file_type: validation.cv.mimeType,
    cv_file_size: validation.cv.size,
    user_agent: optionalText(firstHeaderValue(request.headers["user-agent"]), 500),
    notification_status: "received",
  };

  const { data: insertedApplication, error: insertError } = await supabaseAdmin
    .from("career_applications")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError || !insertedApplication?.id) {
    console.error("[Careers API] Insert failed", insertError);
    await supabaseAdmin.storage.from("career-cvs").remove([cvPath]);
    sendJson(response, 500, { error: "Could not submit your application." });
    return;
  }

  const applicationForEmail: CareerApplicationEmailInfo = {
    ...insertPayload,
    id: insertedApplication.id,
  };

  try {
    await sendCareerSubmissionEmails(
      applicationForEmail,
      roleResult.role,
      getAdminUrl(request)
    );

    await supabaseAdmin
      .from("career_applications")
      .update({
        notification_status: "email_sent",
        notification_sent_at: new Date().toISOString(),
        receipt_sent_at: new Date().toISOString(),
      })
      .eq("id", insertedApplication.id);
  } catch (emailError) {
    console.error("[Careers API] Email delivery failed", emailError);
    const message =
      emailError instanceof Error ? emailError.message.slice(0, 1000) : "Email failed.";

    await supabaseAdmin
      .from("career_applications")
      .update({
        notification_status: "email_failed",
        notification_error: message,
        receipt_error: message,
      })
      .eq("id", insertedApplication.id);

    sendJson(response, emailError instanceof EmailConfigurationError ? 500 : 502, {
      error:
        emailError instanceof EmailConfigurationError
          ? "Careers email is not configured."
          : "Your application was saved, but email delivery failed. Please try again later.",
    });
    return;
  }

  sendJson(response, 200, { ok: true, id: insertedApplication.id });
}

async function sendCareerSubmissionEmails(
  application: CareerApplicationEmailInfo,
  role: CareerRoleRow,
  adminUrl: string
) {
  const internalEmail = buildCareerInternalSubmissionEmail(
    application,
    role,
    adminUrl
  );
  const receiptEmail = buildCareerReceiptEmail(application, role);
  const supportEmail = getSupportRecipientEmail();
  const from = getCareersSenderEmail();

  await Promise.all([
    sendEmail({
      from,
      to: supportEmail,
      replyTo: application.applicant_email,
      subject: internalEmail.subject,
      text: internalEmail.text,
      html: internalEmail.html,
    }),
    sendEmail({
      from,
      to: application.applicant_email,
      replyTo: supportEmail,
      subject: receiptEmail.subject,
      text: receiptEmail.text,
      html: receiptEmail.html,
    }),
  ]);
}

async function loadOpenRole(supabaseAdmin: AdminClient, roleId: string) {
  const { data, error } = await supabaseAdmin
    .from("career_roles")
    .select(
      "id, title, department, location, employment_type, status, published_at, closes_at"
    )
    .eq("id", roleId)
    .single();

  if (error || !data) {
    console.error("[Careers API] Role lookup failed", error);
    return { error: "Please choose a valid open role." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const publishedAt = data.published_at
    ? new Date(data.published_at).getTime()
    : null;

  if (
    data.status !== "open" ||
    (publishedAt !== null && publishedAt > Date.now()) ||
    (data.closes_at !== null && data.closes_at < today)
  ) {
    return { error: "This role is no longer accepting applications." };
  }

  return { role: data as CareerRoleRow };
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
    return { error: "Invalid career application." };
  }

  const input = payload as CareerPayload;
  const roleId = requiredText(input.role_id, 80);
  const applicantName = requiredText(input.applicant_name, 160);
  const applicantEmail = requiredText(input.applicant_email, 320).toLowerCase();
  const applicantPhone = requiredText(input.applicant_phone, 80);
  const applicantLocation = requiredText(input.applicant_location, 160);
  const availability = requiredText(input.availability, 160);
  const workAuthorization = requiredText(input.work_authorization, 220);
  const coverMessage = requiredText(input.cover_message, 4000);

  if (
    !roleId ||
    !applicantName ||
    !applicantEmail ||
    !applicantPhone ||
    !applicantLocation ||
    !availability ||
    !workAuthorization ||
    !coverMessage
  ) {
    return { error: "Please complete all required fields." };
  }

  if (!EMAIL_PATTERN.test(applicantEmail)) {
    return { error: "Please enter a valid email address." };
  }

  if (input.consent_privacy !== true || input.consent_contact !== true) {
    return { error: "Please confirm the application consent fields." };
  }

  const linkedinUrl = optionalUrl(input.linkedin_url, 500);
  if (linkedinUrl === false) {
    return { error: "LinkedIn URL must be a valid http or https URL." };
  }

  const portfolioUrl = optionalUrl(input.portfolio_url, 500);
  if (portfolioUrl === false) {
    return { error: "Portfolio URL must be a valid http or https URL." };
  }

  const cv = sanitizeCv(input.cv_file);
  if ("error" in cv) return cv;

  const application: SanitizedApplication = {
    role_id: roleId,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone: applicantPhone,
    applicant_location: applicantLocation,
    linkedin_url: linkedinUrl,
    portfolio_url: portfolioUrl,
    current_company: optionalText(input.current_company, 160),
    years_experience: optionalText(input.years_experience, 80),
    availability,
    work_authorization: workAuthorization,
    salary_expectation: optionalText(input.salary_expectation, 120),
    cover_message: coverMessage,
    source: "website",
    status: "submitted",
    consent_privacy: true,
    consent_contact: true,
  };

  return { application, cv };
}

function sanitizeCv(value: unknown): SanitizedCv | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "Please upload your CV." };
  }

  const input = value as CvPayload;
  const originalName = requiredText(input.name, 240);
  const mimeType = resolveCvMimeType(
    requiredText(input.type, 160),
    originalName
  );
  const declaredSize =
    typeof input.size === "number" && Number.isFinite(input.size)
      ? input.size
      : 0;
  const base64 =
    typeof input.base64 === "string"
      ? input.base64.replace(/\s/g, "")
      : "";

  if (!originalName || !mimeType || !base64) {
    return { error: "CV must be a PDF, DOC, or DOCX file." };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return { error: "CV file could not be read." };
  }

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_CV_BYTES) {
    return { error: "CV must be smaller than 5 MB." };
  }

  if (declaredSize > 0 && Math.abs(declaredSize - buffer.byteLength) > 4) {
    return { error: "CV file size could not be verified." };
  }

  return {
    fileName: safeFileName(originalName, mimeType),
    mimeType,
    size: buffer.byteLength,
    buffer,
  };
}

function resolveCvMimeType(type: string, fileName: string) {
  if (ALLOWED_CV_TYPES.has(type)) return type;

  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".doc")) return "application/msword";
  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "";
}

function safeFileName(fileName: string, mimeType: string) {
  const extension = CV_EXTENSIONS[mimeType] ?? "pdf";
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const safeStem =
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "cv";

  return `${safeStem}.${extension}`;
}

function buildCvPath(email: string, fileName: string, mimeType: string) {
  const date = new Date().toISOString().slice(0, 10);
  const emailStem =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "candidate";
  const extension = CV_EXTENSIONS[mimeType] ?? "pdf";
  const fileStem = fileName.replace(/\.[^.]+$/, "");

  return `applications/${date}/${emailStem}-${randomUUID()}-${fileStem}.${extension}`;
}

async function checkRateLimit(
  supabaseAdmin: AdminClient,
  ipAddress: string,
  email: string
) {
  const checks = [
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_careers_ip",
      p_subject: ipAddress,
      p_max_attempts: 5,
      p_window_seconds: 3600,
    }),
    supabaseAdmin.rpc("consume_edge_rate_limit", {
      p_scope: "admin_web_careers_email",
      p_subject: email,
      p_max_attempts: 3,
      p_window_seconds: 86400,
    }),
  ];

  const results = await Promise.all(checks);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    console.error("[Careers API] Rate limit check failed", firstError);
    return false;
  }

  return results.every((result) => result.data === true);
}

function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return stripControlCharacters(value).trim().slice(0, maxLength);
}

function stripControlCharacters(value: string) {
  let sanitized = "";

  for (const character of value) {
    const code = character.charCodeAt(0);
    sanitized += code <= 31 || code === 127 ? " " : character;
  }

  return sanitized;
}

function optionalText(value: unknown, maxLength: number) {
  const text =
    typeof value === "string"
      ? stripControlCharacters(value).trim().slice(0, maxLength)
      : "";
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

function getCareersSenderEmail() {
  return (
    cleanEnvValue(process.env.CAREERS_FROM_EMAIL) ??
    cleanEnvValue(process.env.CONTACT_FROM_EMAIL) ??
    "UmmahWay <support@ummahway.com>"
  );
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = firstHeaderValue(request.headers["x-forwarded-for"]);
  const realIp = firstHeaderValue(request.headers["x-real-ip"]);
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || realIp || request.socket.remoteAddress || "unknown";
}

function getAdminUrl(request: IncomingMessage) {
  const forwardedProto = firstHeaderValue(request.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeaderValue(request.headers["x-forwarded-host"]);
  const host = forwardedHost || firstHeaderValue(request.headers.host) || "ummahway.com";
  const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}/admin`;
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
