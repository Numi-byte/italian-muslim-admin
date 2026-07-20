type EmailPayload = {
  from?: string;
  to: string | string[];
  replyTo?: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export class EmailConfigurationError extends Error {
  constructor(message = "Email provider is not configured.") {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(payload: EmailPayload) {
  const resendApiKey = cleanEnvValue(
    process.env.CONTACT_RESEND_API_KEY ?? process.env.RESEND_API_KEY
  );

  if (!resendApiKey) {
    throw new EmailConfigurationError();
  }

  const fromEmail =
    cleanEnvValue(payload.from) ??
    cleanEnvValue(process.env.CONTACT_FROM_EMAIL) ??
    cleanEnvValue(process.env.RESEND_FROM_EMAIL);

  if (!fromEmail) {
    throw new EmailConfigurationError(
      "Email sender is not configured. Set CONTACT_FROM_EMAIL."
    );
  }

  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
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

export function getSupportRecipientEmail() {
  return (
    cleanEnvValue(process.env.CONTACT_TO_EMAIL) ??
    cleanEnvValue(process.env.SUPPORT_TO_EMAIL) ??
    "support@ummahway.com"
  );
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") || undefined;
}
