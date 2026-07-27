import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";
import { trackSiteEvent } from "../lib/vercelAnalytics";

type CareerRole = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  seniority: string;
  status: string;
  summary: string;
  responsibilities: string;
  requirements: string;
  nice_to_have: string | null;
  salary_range: string | null;
  sort_order: number | null;
  published_at: string | null;
  closes_at: string | null;
};

type FormState = {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_location: string;
  linkedin_url: string;
  portfolio_url: string;
  current_company: string;
  years_experience: string;
  availability: string;
  work_authorization: string;
  salary_expectation: string;
  cover_message: string;
  consent_privacy: boolean;
  consent_contact: boolean;
  website: string;
};

type SubmissionPayload = Omit<FormState, "consent_privacy" | "consent_contact"> & {
  role_id: string;
  consent_privacy: boolean;
  consent_contact: boolean;
  cv_file: {
    name: string;
    type: string;
    size: number;
    base64: string;
  };
};

const initialForm: FormState = {
  applicant_name: "",
  applicant_email: "",
  applicant_phone: "",
  applicant_location: "",
  linkedin_url: "",
  portfolio_url: "",
  current_company: "",
  years_experience: "",
  availability: "",
  work_authorization: "",
  salary_expectation: "",
  cover_message: "",
  consent_privacy: false,
  consent_contact: false,
  website: "",
};

const requiredFields: (keyof FormState)[] = [
  "applicant_name",
  "applicant_email",
  "applicant_phone",
  "applicant_location",
  "availability",
  "work_authorization",
  "cover_message",
];

const employmentLabels: Record<string, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractor: "Contract",
  volunteer: "Volunteer",
  internship: "Internship",
  temporary: "Temporary",
};

const allowedCvTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const maxCvSizeBytes = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const CareersPage: React.FC = () => {
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/careers");
    setPageSeo({
      title: "Careers | UmmahWay",
      description:
        "Explore open roles at UmmahWay and submit your CV for active opportunities.",
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Careers at UmmahWay",
        url: canonicalUrl,
        description:
          "Open roles at UmmahWay for candidates who want to help build useful Muslim community technology.",
        isPartOf: {
          "@type": "WebSite",
          name: "UmmahWay",
          url: "https://ummahway.com",
        },
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      setRolesLoading(true);
      setRolesError(null);

      const { data, error } = await supabase
        .from("career_roles")
        .select(
          "id, title, department, location, employment_type, seniority, status, summary, responsibilities, requirements, nice_to_have, salary_range, sort_order, published_at, closes_at"
        )
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("[Careers] Could not load roles", error);
        setRoles([]);
        setRolesError(
          "Careers are being prepared. Please check back soon or contact support@ummahway.com."
        );
      } else {
        const visibleRoles = ((data ?? []) as CareerRole[]).filter(isOpenRole);
        setRoles(visibleRoles);
        setSelectedRoleId((current) =>
          visibleRoles.some((role) => role.id === current)
            ? current
            : visibleRoles[0]?.id ?? ""
        );
      }

      setRolesLoading(false);
    };

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const setField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMessage(null);
    setMessageType(null);

    if (!file) {
      setCvFile(null);
      return;
    }

    if (!isAllowedCv(file)) {
      setCvFile(null);
      event.target.value = "";
      setMessage("Please upload a PDF, DOC, or DOCX CV.");
      setMessageType("error");
      return;
    }

    if (file.size > maxCvSizeBytes) {
      setCvFile(null);
      event.target.value = "";
      setMessage("Your CV must be smaller than 5 MB.");
      setMessageType("error");
      return;
    }

    setCvFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!selectedRole) {
      setMessage("Please choose an open role before applying.");
      setMessageType("error");
      return;
    }

    const missing = requiredFields.find((field) => {
      const value = form[field];
      return typeof value === "string" && !value.trim();
    });

    if (missing || !cvFile) {
      trackSiteEvent("Career Application Submit Failed", {
        reason: missing ? "missing_required" : "missing_cv",
      });
      setMessage("Please complete all required fields and upload your CV.");
      setMessageType("error");
      return;
    }

    if (!form.consent_privacy || !form.consent_contact) {
      setMessage("Please confirm the consent fields before submitting.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    try {
      const base64 = await fileToBase64(cvFile);
      const payload: SubmissionPayload = {
        role_id: selectedRole.id,
        applicant_name: form.applicant_name.trim(),
        applicant_email: form.applicant_email.trim(),
        applicant_phone: form.applicant_phone.trim(),
        applicant_location: form.applicant_location.trim(),
        linkedin_url: form.linkedin_url.trim(),
        portfolio_url: form.portfolio_url.trim(),
        current_company: form.current_company.trim(),
        years_experience: form.years_experience.trim(),
        availability: form.availability.trim(),
        work_authorization: form.work_authorization.trim(),
        salary_expectation: form.salary_expectation.trim(),
        cover_message: form.cover_message.trim(),
        consent_privacy: form.consent_privacy,
        consent_contact: form.consent_contact,
        website: form.website.trim(),
        cv_file: {
          name: cvFile.name,
          type: cvFile.type,
          size: cvFile.size,
          base64,
        },
      };

      const response = await fetch("/api/careers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        trackSiteEvent("Career Application Submit Failed", {
          status_code: response.status,
        });
        setMessage(result?.error ?? "Could not submit your application.");
        setMessageType("error");
        return;
      }

      trackSiteEvent("Career Application Submitted", {
        role_id: selectedRole.id,
        role_title: selectedRole.title,
      });
      setForm(initialForm);
      setCvFile(null);
      setFileInputKey((prev) => prev + 1);
      setMessage(
        "Application submitted. We sent a confirmation email to your inbox."
      );
      setMessageType("success");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-950">
      <header className="border-b border-emerald-900/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg" />
            <div>
              <div className="text-lg font-semibold text-emerald-950">
                UmmahWay
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Careers
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex"
            >
              Contact
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600/30"
            >
              Back home
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-emerald-900/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,#f8faf9_0%,#ffffff_48%,#eef7f5_100%)]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                Build for the Ummah
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                Open roles at UmmahWay
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Join a focused team building practical technology for masjids,
                families, students, visitors, and Muslim communities across
                Europe.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Community product
                </span>
                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Remote-aware work
                </span>
                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Careful selection
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white bg-emerald-950 p-6 text-white shadow-2xl shadow-emerald-950/20">
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="" className="h-12 w-12 rounded-xl" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    UmmahWay Careers
                  </p>
                  <p className="text-xs text-emerald-100/70">
                    Applications are reviewed privately by the super admin.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="text-2xl font-bold">{roles.length}</div>
                  <div className="text-xs font-medium text-emerald-100/75">
                    open role{roles.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="text-2xl font-bold">CV</div>
                  <div className="text-xs font-medium text-emerald-100/75">
                    secure upload
                  </div>
                </div>
                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="text-2xl font-bold">Email</div>
                  <div className="text-xs font-medium text-emerald-100/75">
                    confirmation response
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Open roles</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Choose the role that best matches your experience before
                submitting your CV.
              </p>
            </div>

            {rolesError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {rolesError}
              </div>
            )}

            {rolesLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading open roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  No open roles right now
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We are not collecting applications at this moment. New
                  opportunities will appear here when they open.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => {
                  const selected = role.id === selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-500/15"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-950">
                            {role.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {role.department} / {role.location}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                          {employmentLabels[role.employment_type] ??
                            role.employment_type}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {role.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedRole && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {selectedRole.seniority}
                  </span>
                  {selectedRole.salary_range && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {selectedRole.salary_range}
                    </span>
                  )}
                  {selectedRole.closes_at && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                      Closes {formatDate(selectedRole.closes_at)}
                    </span>
                  )}
                </div>

                <RoleTextBlock title="Responsibilities" value={selectedRole.responsibilities} />
                <RoleTextBlock title="Requirements" value={selectedRole.requirements} />
                {selectedRole.nice_to_have && (
                  <RoleTextBlock title="Nice to have" value={selectedRole.nice_to_have} />
                )}
              </article>
            )}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/[0.06] sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">
                Submit your application
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {selectedRole
                  ? `Applying for ${selectedRole.title}.`
                  : "Applications open when a role is available."}
              </p>
            </div>

            {message && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setField("website", event.target.value)}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name *">
                  <input
                    className={inputClass}
                    value={form.applicant_name}
                    onChange={(event) =>
                      setField("applicant_name", event.target.value)
                    }
                  />
                </Field>
                <Field label="Email *">
                  <input
                    className={inputClass}
                    type="email"
                    value={form.applicant_email}
                    onChange={(event) =>
                      setField("applicant_email", event.target.value)
                    }
                  />
                </Field>
                <Field label="Phone *">
                  <input
                    className={inputClass}
                    value={form.applicant_phone}
                    onChange={(event) =>
                      setField("applicant_phone", event.target.value)
                    }
                  />
                </Field>
                <Field label="Location *">
                  <input
                    className={inputClass}
                    value={form.applicant_location}
                    onChange={(event) =>
                      setField("applicant_location", event.target.value)
                    }
                    placeholder="City, country"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    className={inputClass}
                    type="url"
                    value={form.linkedin_url}
                    onChange={(event) =>
                      setField("linkedin_url", event.target.value)
                    }
                    placeholder="https://"
                  />
                </Field>
                <Field label="Portfolio">
                  <input
                    className={inputClass}
                    type="url"
                    value={form.portfolio_url}
                    onChange={(event) =>
                      setField("portfolio_url", event.target.value)
                    }
                    placeholder="https://"
                  />
                </Field>
                <Field label="Current company">
                  <input
                    className={inputClass}
                    value={form.current_company}
                    onChange={(event) =>
                      setField("current_company", event.target.value)
                    }
                  />
                </Field>
                <Field label="Years of experience">
                  <input
                    className={inputClass}
                    value={form.years_experience}
                    onChange={(event) =>
                      setField("years_experience", event.target.value)
                    }
                    placeholder="Example: 4 years"
                  />
                </Field>
                <Field label="Availability *">
                  <input
                    className={inputClass}
                    value={form.availability}
                    onChange={(event) =>
                      setField("availability", event.target.value)
                    }
                    placeholder="Notice period or start date"
                  />
                </Field>
                <Field label="Work authorization *">
                  <input
                    className={inputClass}
                    value={form.work_authorization}
                    onChange={(event) =>
                      setField("work_authorization", event.target.value)
                    }
                    placeholder="Right to work / visa status"
                  />
                </Field>
                <Field label="Salary expectation">
                  <input
                    className={inputClass}
                    value={form.salary_expectation}
                    onChange={(event) =>
                      setField("salary_expectation", event.target.value)
                    }
                  />
                </Field>
                <Field label="CV *">
                  <input
                    key={fileInputKey}
                    className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700`}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCvChange}
                  />
                  {cvFile && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-700">
                      Ready: {cvFile.name}
                    </p>
                  )}
                </Field>
              </div>

              <Field label="Why this role? *">
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.cover_message}
                  onChange={(event) =>
                    setField("cover_message", event.target.value)
                  }
                />
              </Field>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex gap-3 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.consent_privacy}
                    onChange={(event) =>
                      setField("consent_privacy", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm that UmmahWay can process my application data and
                    CV for recruitment selection.
                  </span>
                </label>
                <label className="flex gap-3 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.consent_contact}
                    onChange={(event) =>
                      setField("consent_contact", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I agree to be contacted by email about this application.
                  </span>
                </label>
                <p className="pl-7 text-xs leading-5 text-slate-500">
                  Read the{" "}
                  <Link
                    to="/privacy"
                    className="font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/terms"
                    className="font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                  >
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedRole}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting application..." : "Submit application"}
              </button>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
};

const Field: React.FC<{
  label: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const RoleTextBlock: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => {
  const lines = splitLines(value);
  if (lines.length === 0) return null;

  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

function isOpenRole(role: CareerRole) {
  const today = new Date().toISOString().slice(0, 10);
  const publishedAt = role.published_at
    ? new Date(role.published_at).getTime()
    : null;

  return (
    role.status === "open" &&
    (publishedAt === null || publishedAt <= Date.now()) &&
    (role.closes_at === null || role.closes_at >= today)
  );
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isAllowedCv(file: File) {
  if (allowedCvTypes.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read CV."));
        return;
      }

      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Could not read CV."));
    reader.readAsDataURL(file);
  });
}

export default CareersPage;
