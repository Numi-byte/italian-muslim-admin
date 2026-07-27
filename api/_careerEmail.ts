import { escapeHtml } from "./_email.js";

export type CareerRoleEmailInfo = {
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
};

export type CareerApplicationEmailInfo = {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string | null;
  applicant_location?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  years_experience?: string | null;
  availability?: string | null;
  work_authorization?: string | null;
  salary_expectation?: string | null;
  cover_message?: string | null;
  cv_file_name?: string | null;
};

export function buildCareerInternalSubmissionEmail(
  application: CareerApplicationEmailInfo,
  role: CareerRoleEmailInfo,
  adminUrl: string
)
{
  const roleTitle = role.title || "Open role";
  const subject = `[UmmahWay Careers] New application: ${roleTitle}`;
  const text = `New UmmahWay career application

Reference: ${application.id}
Role: ${roleTitle}
Department: ${role.department ?? "N/A"}
Location: ${role.location ?? "N/A"}

Applicant:
- Name: ${application.applicant_name}
- Email: ${application.applicant_email}
- Phone: ${application.applicant_phone ?? "N/A"}
- Location: ${application.applicant_location ?? "N/A"}
- LinkedIn: ${application.linkedin_url ?? "N/A"}
- Portfolio: ${application.portfolio_url ?? "N/A"}
- Experience: ${application.years_experience ?? "N/A"}
- Availability: ${application.availability ?? "N/A"}
- Work authorization: ${application.work_authorization ?? "N/A"}
- Salary expectation: ${application.salary_expectation ?? "N/A"}
- CV: ${application.cv_file_name ?? "Stored in admin"}

Cover message:
${application.cover_message ?? "N/A"}

Manage this application in the private admin area:
${adminUrl}`;

  const html = emailShell(`
    <h1 style="margin: 0; font-size: 22px; color: #14532d;">New career application</h1>
    <p style="margin: 8px 0 24px; color: #52616b; font-size: 15px; line-height: 1.6;">
      A candidate submitted an application through the UmmahWay careers page.
    </p>

    ${detailTable([
      ["Reference", application.id],
      ["Role", roleTitle],
      ["Department", role.department ?? "N/A"],
      ["Location", role.location ?? "N/A"],
      ["Name", application.applicant_name],
      ["Email", application.applicant_email],
      ["Phone", application.applicant_phone ?? "N/A"],
      ["Candidate location", application.applicant_location ?? "N/A"],
      ["LinkedIn", application.linkedin_url ?? "N/A"],
      ["Portfolio", application.portfolio_url ?? "N/A"],
      ["Experience", application.years_experience ?? "N/A"],
      ["Availability", application.availability ?? "N/A"],
      ["Work authorization", application.work_authorization ?? "N/A"],
      ["Salary expectation", application.salary_expectation ?? "N/A"],
      ["CV", application.cv_file_name ?? "Stored in admin"],
    ])}

    <div style="margin-top: 22px;">
      <p style="margin: 0 0 8px; color: #14532d; font-size: 14px; font-weight: 700;">Cover message</p>
      <div style="white-space: pre-wrap; background: #f6f7f4; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; color: #1f2933; font-size: 15px; line-height: 1.6;">${escapeHtml(
        application.cover_message ?? "N/A"
      )}</div>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="${escapeHtml(adminUrl)}" style="display: inline-block; border-radius: 12px; background: #14532d; color: #ffffff; font-size: 14px; font-weight: 700; padding: 12px 18px; text-decoration: none;">
        Open private admin area
      </a>
    </div>
  `);

  return { subject, text, html };
}

export function buildCareerReceiptEmail(
  application: CareerApplicationEmailInfo,
  role: CareerRoleEmailInfo
)
{
  const roleTitle = role.title || "the selected role";
  const subject = `We received your application for ${roleTitle}`;
  const text = `Assalamu alaykum ${application.applicant_name},

Thank you for applying to UmmahWay.

We received your application for ${roleTitle}. Our team will review your CV and the details you shared. If your profile matches the next stage, we will contact you by email.

Reference: ${application.id}
Role: ${roleTitle}
Email: ${application.applicant_email}

This message confirms that your application was submitted successfully. You do not need to reply to this email unless you need to correct your details.`;

  const html = emailShell(`
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 24px; color: #14532d;">Application received</h1>
      <p style="margin: 8px 0 0; color: #52616b; font-size: 15px; line-height: 1.6;">
        Thank you for your interest in joining UmmahWay.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Assalamu alaykum ${escapeHtml(application.applicant_name)},
    </p>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      We received your application and CV. Our team will review your details carefully, and if your profile matches the next stage, we will contact you by email.
    </p>

    ${detailTable([
      ["Reference", application.id],
      ["Role", roleTitle],
      ["Department", role.department ?? "N/A"],
      ["Location", role.location ?? "N/A"],
      ["Email", application.applicant_email],
    ])}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

    <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 0;">
      You do not need to reply to this email unless you need to correct your submitted details.
    </p>
  `);

  return { subject, text, html };
}

export function buildCareerRejectionEmail(
  application: CareerApplicationEmailInfo,
  role: CareerRoleEmailInfo
)
{
  const roleTitle = role.title || applicationRoleFallback(application);
  const subject = `Update on your UmmahWay application`;
  const text = `Assalamu alaykum ${application.applicant_name},

Thank you for taking the time to apply for ${roleTitle} at UmmahWay.

After careful review, we will not be moving forward with your application for this role at this time. We appreciate the effort you put into your application and your interest in contributing to UmmahWay.

We will keep improving the way we serve Muslim communities, and we sincerely wish you success in your next opportunity.

Reference: ${application.id}
Role: ${roleTitle}

UmmahWay Careers`;

  const html = emailShell(`
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 24px; color: #14532d;">Application update</h1>
      <p style="margin: 8px 0 0; color: #52616b; font-size: 15px; line-height: 1.6;">
        Thank you for your interest in UmmahWay.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Assalamu alaykum ${escapeHtml(application.applicant_name)},
    </p>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Thank you for taking the time to apply for <strong>${escapeHtml(roleTitle)}</strong>.
    </p>

    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      After careful review, we will not be moving forward with your application for this role at this time. We appreciate the effort you put into your application and your interest in contributing to UmmahWay.
    </p>

    ${detailTable([
      ["Reference", application.id],
      ["Role", roleTitle],
    ])}

    <p style="font-size: 16px; line-height: 1.6; margin: 22px 0 0;">
      We sincerely wish you success in your next opportunity.
    </p>
  `);

  return { subject, text, html };
}

function applicationRoleFallback(application: CareerApplicationEmailInfo) {
  return application.id ? "the role you applied for" : "the selected role";
}

function emailShell(content: string) {
  return `<div style="font-family: Arial, sans-serif; background-color: #f6f7f4; padding: 32px 16px; color: #1f2933;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; border: 1px solid #e5e7eb;">
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
