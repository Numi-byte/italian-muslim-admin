import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
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
  buildCareerRejectionEmail,
  type CareerApplicationEmailInfo,
  type CareerRoleEmailInfo,
} from "./_careerEmail.js";

const SUPER_ADMIN_USER_ID = "e4d243f9-9b01-42d4-8dec-f1826bfe74ca";
const MAX_BODY_BYTES = 12 * 1024;

type AdminPayload = {
  action?: unknown;
  application_id?: unknown;
  rejection_note?: unknown;
};

type CareerApplicationRow = CareerApplicationEmailInfo & {
  id: string;
  role_id: string | null;
  role_title_snapshot: string;
  status: string;
  rejection_sent_at: string | null;
  created_at: string;
};

type CareerRoleRow = CareerRoleEmailInfo & {
  id: string;
  title: string;
};

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
      career_roles: {
        Row: CareerRoleRow;
        Insert: Partial<CareerRoleRow>;
        Update: Partial<CareerRoleRow>;
        Relationships: [];
      };
      career_applications: {
        Row: CareerApplicationRow;
        Insert: Record<string, never>;
        Update: Partial<CareerApplicationRow> & {
          reviewed_at?: string;
          reviewed_by?: string;
          rejection_email_error?: string | null;
          rejection_note?: string | null;
          internal_notes?: string | null;
        };
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
    console.error("[Careers Admin API] Invalid Supabase server env", error);
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
    sendJson(response, 500, { error: "Careers admin API is not configured." });
    return;
  }

  const adminUser = await requireSuperAdmin(supabaseAdmin, request);
  if ("error" in adminUser) {
    sendJson(response, adminUser.status, { error: adminUser.error });
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

  const payload = sanitizePayload(rawPayload);
  if ("error" in payload) {
    sendJson(response, 400, { error: payload.error });
    return;
  }

  if (payload.action !== "reject_application") {
    sendJson(response, 400, { error: "Unsupported careers action." });
    return;
  }

  const result = await rejectApplication(
    supabaseAdmin,
    adminUser.userId,
    payload.applicationId,
    payload.rejectionNote
  );

  if ("error" in result) {
    sendJson(response, result.status, { error: result.error });
    return;
  }

  sendJson(response, 200, { ok: true });
}

async function rejectApplication(
  supabaseAdmin: AdminClient,
  adminUserId: string,
  applicationId: string,
  rejectionNote: string | null
) {
  const { data: application, error: applicationError } = await supabaseAdmin
    .from("career_applications")
    .select(
      "id, role_id, role_title_snapshot, status, applicant_name, applicant_email, applicant_phone, applicant_location, linkedin_url, portfolio_url, years_experience, availability, work_authorization, salary_expectation, cover_message, cv_file_name, rejection_sent_at, created_at"
    )
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    console.error("[Careers Admin API] Application lookup failed", applicationError);
    return { status: 404, error: "Application was not found." };
  }

  let role: CareerRoleRow = {
    id: application.role_id ?? "",
    title: application.role_title_snapshot,
  };

  if (application.role_id) {
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("career_roles")
      .select("id, title, department, location, employment_type")
      .eq("id", application.role_id)
      .maybeSingle();

    if (roleError) {
      console.error("[Careers Admin API] Role lookup failed", roleError);
    } else if (roleData) {
      role = roleData as CareerRoleRow;
    }
  }

  const email = buildCareerRejectionEmail(application, role);
  const supportEmail = getSupportRecipientEmail();

  const updatePayload = {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUserId,
    rejection_note: rejectionNote,
    internal_notes: rejectionNote,
  };

  const { error: updateError } = await supabaseAdmin
    .from("career_applications")
    .update(updatePayload)
    .eq("id", applicationId);

  if (updateError) {
    console.error("[Careers Admin API] Reject update failed", updateError);
    return { status: 500, error: "Could not reject this application." };
  }

  try {
    await sendEmail({
      from: getCareersSenderEmail(),
      to: application.applicant_email,
      replyTo: supportEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    await supabaseAdmin
      .from("career_applications")
      .update({
        rejection_sent_at: new Date().toISOString(),
        rejection_email_error: null,
      })
      .eq("id", applicationId);
  } catch (emailError) {
    console.error("[Careers Admin API] Rejection email failed", emailError);
    const message =
      emailError instanceof Error ? emailError.message.slice(0, 1000) : "Email failed.";

    await supabaseAdmin
      .from("career_applications")
      .update({
        rejection_email_error: message,
      })
      .eq("id", applicationId);

    return {
      status: emailError instanceof EmailConfigurationError ? 500 : 502,
      error:
        emailError instanceof EmailConfigurationError
          ? "Careers email is not configured."
          : "Application was rejected, but the email could not be sent.",
    };
  }

  return { ok: true };
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
    console.error("[Careers Admin API] Invalid bearer token", userError);
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
    console.error("[Careers Admin API] Profile lookup failed", profileError);
    return { status: 403, error: "Could not verify admin permissions." };
  }

  if (profile?.role !== "super_admin") {
    return { status: 403, error: "Only a super admin can manage careers." };
  }

  return { userId: user.id };
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

function sanitizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid careers admin request." };
  }

  const input = payload as AdminPayload;
  const action = requiredText(input.action, 80);
  const applicationId = requiredText(input.application_id, 80);
  const rejectionNote = optionalText(input.rejection_note, 1500);

  if (!action || !applicationId) {
    return { error: "Missing application action details." };
  }

  return { action, applicationId, rejectionNote };
}

function requiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return stripControlCharacters(value).trim().slice(0, maxLength);
}

function optionalText(value: unknown, maxLength: number) {
  const text = requiredText(value, maxLength);
  return text || null;
}

function stripControlCharacters(value: string) {
  let sanitized = "";

  for (const character of value) {
    const code = character.charCodeAt(0);
    sanitized += code <= 31 || code === 127 ? " " : character;
  }

  return sanitized;
}

function getBearerToken(authorizationHeader: string | string[] | undefined) {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function getCareersSenderEmail() {
  return (
    cleanEnvValue(process.env.CAREERS_FROM_EMAIL) ??
    cleanEnvValue(process.env.CONTACT_FROM_EMAIL) ??
    "UmmahWay <support@ummahway.com>"
  );
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
