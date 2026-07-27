import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
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
  "w-full rounded-xl border border-[#d8cfb8] bg-white px-3.5 py-2.5 text-sm text-[#1c2b26] outline-none transition placeholder:text-[#9a8c68] focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6b7a74]";

const VALUES = [
  {
    title: "Serve the Ummah",
    description:
      "Everything we ship helps masjids, families, students, and travellers find accurate prayer times and community information.",
    icon: (
      <>
        <path d="M12 3c2.5 2 4 3.6 4 5.5A4 4 0 0 1 8 8.5C8 6.6 9.5 5 12 3Z" />
        <path d="M4 21v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
        <path d="M4 21h16M9 21v-4a3 3 0 0 1 6 0v4" />
      </>
    ),
  },
  {
    title: "Small, focused team",
    description:
      "No layers of process. You work directly on the product, see your work live quickly, and own real outcomes.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5M17 14.5a5.5 5.5 0 0 1 3.5 5.5" />
      </>
    ),
  },
  {
    title: "Remote-aware work",
    description:
      "We hire across Europe and work asynchronously where it makes sense, with clear communication and honest expectations.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9Z" />
      </>
    ),
  },
];

const HIRING_STEPS = [
  {
    title: "Apply",
    description: "Pick a role and send your CV with a short note on why it fits.",
  },
  {
    title: "Review",
    description: "Applications are reviewed privately. We reply to every candidate.",
  },
  {
    title: "Conversation",
    description: "A focused call about your experience and the work itself.",
  },
  {
    title: "Decision",
    description: "A clear yes or no, quickly — with feedback either way.",
  },
];

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
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c2b26] antialiased">
      <PublicNav tagline="Careers" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0a3d30] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #e6cf9a 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <p className="font-arabic text-2xl text-[#e6cf9a]">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-[#e6cf9a]">
              Careers at UmmahWay
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Build technology that serves the Ummah.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              We are a small team building practical tools for masjids,
              families, students, and Muslim communities across Europe. Work
              that is useful, honest, and made with care.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#roles"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e6cf9a] px-6 py-3 text-sm font-bold text-[#0a3d30] shadow-lg shadow-black/20 transition hover:bg-[#f0dcae]"
              >
                View open roles
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-[#e6cf9a] hover:text-[#e6cf9a]"
              >
                Ask a question
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-3">
              <div className="flex flex-col rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <dt className="order-last mt-1 text-xs font-medium text-white/60">
                  open role{roles.length === 1 ? "" : "s"}
                </dt>
                <dd className="font-display text-3xl font-semibold text-[#e6cf9a]">
                  {rolesLoading ? "–" : roles.length}
                </dd>
              </div>
              <div className="flex flex-col rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <dt className="order-last mt-1 text-xs font-medium text-white/60">
                  reply to applicants
                </dt>
                <dd className="font-display text-3xl font-semibold text-[#e6cf9a]">
                  100%
                </dd>
              </div>
              <div className="flex flex-col rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <dt className="order-last mt-1 text-xs font-medium text-white/60">
                  countries served
                </dt>
                <dd className="font-display text-3xl font-semibold text-[#e6cf9a]">
                  EU
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-[#e7e1d3]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f5c46]">
              Why UmmahWay
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-[#0a3d30]">
              Meaningful work, done properly.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="rounded-2xl border border-[#e7e1d3] bg-white p-6 shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ea] text-[#0f5c46]">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      {value.icon}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[#0a3d30]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#4a5852]">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hiring process */}
        <section className="border-b border-[#e7e1d3] bg-[#eef2ea]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f5c46]">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-[#0a3d30]">
              A short, respectful process.
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HIRING_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-[#d8cfb8]/60 bg-white p-5"
                >
                  <span className="font-display text-3xl font-semibold text-[#c9b06a]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-[#0a3d30]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#4a5852]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles + application */}
        <section
          id="roles"
          className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8"
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f5c46]">
                Open roles
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#0a3d30]">
                Where you could fit in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7a74]">
                Choose the role that best matches your experience, then apply
                with your CV.
              </p>
            </div>

            {rolesError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {rolesError}
              </div>
            )}

            {rolesLoading ? (
              <div className="space-y-3">
                {[0, 1].map((index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-[#e7e1d3] bg-white p-5"
                  >
                    <div className="h-4 w-2/5 rounded bg-[#eef2ea]" />
                    <div className="mt-3 h-3 w-3/5 rounded bg-[#eef2ea]" />
                    <div className="mt-4 h-3 w-full rounded bg-[#eef2ea]" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-[#eef2ea]" />
                  </div>
                ))}
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8cfb8] bg-white p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2ea] text-[#0f5c46]">
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
                    <rect x="4" y="7" width="16" height="13" rx="2" />
                    <path d="M4 12h16M10 12v2h4v-2" />
                  </svg>
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-[#0a3d30]">
                  No open roles right now
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6b7a74]">
                  We are not collecting applications at this moment. New
                  opportunities will appear here when they open — check back
                  soon.
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
                      aria-pressed={selected}
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-[#0f5c46]/50 bg-white shadow-lg shadow-[#0f5c46]/10 ring-2 ring-[#0f5c46]/15"
                          : "border-[#e7e1d3] bg-white/70 hover:border-[#d8cfb8] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-[#0a3d30]">
                            {role.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-[#6b7a74]">
                            {role.department} · {role.location}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            selected
                              ? "bg-[#0f5c46] text-white"
                              : "bg-[#eef2ea] text-[#0f5c46]"
                          }`}
                        >
                          {employmentLabels[role.employment_type] ??
                            role.employment_type}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4a5852]">
                        {role.summary}
                      </p>
                      {selected && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0f5c46]">
                          <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                          Selected for your application
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedRole && (
              <article className="rounded-2xl border border-[#e7e1d3] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#4a5852]">
                  <span className="rounded-full bg-[#eef2ea] px-2.5 py-1 capitalize">
                    {selectedRole.seniority}
                  </span>
                  {selectedRole.salary_range && (
                    <span className="rounded-full bg-[#eef2ea] px-2.5 py-1">
                      {selectedRole.salary_range}
                    </span>
                  )}
                  {selectedRole.closes_at && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                      Closes {formatDate(selectedRole.closes_at)}
                    </span>
                  )}
                </div>

                <RoleTextBlock
                  title="Responsibilities"
                  value={selectedRole.responsibilities}
                />
                <RoleTextBlock
                  title="Requirements"
                  value={selectedRole.requirements}
                />
                {selectedRole.nice_to_have && (
                  <RoleTextBlock
                    title="Nice to have"
                    value={selectedRole.nice_to_have}
                  />
                )}
              </article>
            )}
          </div>

          <section
            id="apply"
            className="h-fit rounded-3xl border border-[#e7e1d3] bg-white p-5 shadow-xl shadow-[#0a3d30]/[0.06] sm:p-7 lg:sticky lg:top-24"
          >
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f5c46]">
                Application
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#0a3d30]">
                {selectedRole ? `Apply for ${selectedRole.title}` : "Apply"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7a74]">
                {selectedRole
                  ? "Your application and CV are reviewed privately, and you will receive a confirmation email."
                  : "Applications open when a role is available."}
              </p>
            </div>

            {message && (
              <div
                className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                  messageType === "success"
                    ? "border-[#0f5c46]/25 bg-[#eef2ea] text-[#0a3d30]"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setField("website", event.target.value)}
              />

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-[#0a3d30]">
                  About you
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name *">
                    <input
                      className={inputClass}
                      autoComplete="name"
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
                      autoComplete="email"
                      value={form.applicant_email}
                      onChange={(event) =>
                        setField("applicant_email", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Phone *">
                    <input
                      className={inputClass}
                      autoComplete="tel"
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
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-[#0a3d30]">
                  Experience &amp; links
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-[#0a3d30]">
                  Practical details
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-[#0a3d30]">
                  Your CV &amp; motivation
                </legend>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
                    cvFile
                      ? "border-[#0f5c46]/50 bg-[#eef2ea]"
                      : "border-[#d8cfb8] bg-[#faf8f2] hover:border-[#0f5c46]/40"
                  }`}
                >
                  <input
                    key={fileInputKey}
                    className="sr-only"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCvChange}
                  />
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0f5c46] ring-1 ring-[#e7e1d3]">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 16V4M7 9l5-5 5 5" />
                      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                    </svg>
                  </span>
                  {cvFile ? (
                    <>
                      <span className="text-sm font-bold text-[#0a3d30]">
                        {cvFile.name}
                      </span>
                      <span className="text-xs text-[#0f5c46]">
                        Ready to submit — tap to replace
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-[#0a3d30]">
                        Upload your CV *
                      </span>
                      <span className="text-xs text-[#9a8c68]">
                        PDF, DOC, or DOCX — up to 5 MB
                      </span>
                    </>
                  )}
                </label>

                <div className="mt-3">
                  <Field label="Why this role? *">
                    <textarea
                      className={`${inputClass} min-h-32 resize-y`}
                      value={form.cover_message}
                      onChange={(event) =>
                        setField("cover_message", event.target.value)
                      }
                      placeholder="A few sentences about why this role and what you would bring."
                    />
                  </Field>
                </div>
              </fieldset>

              <div className="space-y-2 rounded-2xl border border-[#e7e1d3] bg-[#faf8f2] p-4">
                <label className="flex gap-3 text-sm leading-6 text-[#4a5852]">
                  <input
                    type="checkbox"
                    checked={form.consent_privacy}
                    onChange={(event) =>
                      setField("consent_privacy", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-[#d8cfb8] text-[#0f5c46] focus:ring-[#0f5c46]"
                  />
                  <span>
                    I confirm that UmmahWay can process my application data and
                    CV for recruitment selection.
                  </span>
                </label>
                <label className="flex gap-3 text-sm leading-6 text-[#4a5852]">
                  <input
                    type="checkbox"
                    checked={form.consent_contact}
                    onChange={(event) =>
                      setField("consent_contact", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-[#d8cfb8] text-[#0f5c46] focus:ring-[#0f5c46]"
                  />
                  <span>
                    I agree to be contacted by email about this application.
                  </span>
                </label>
                <p className="pl-7 text-xs leading-5 text-[#6b7a74]">
                  Read the{" "}
                  <Link
                    to="/privacy"
                    className="font-bold text-[#0f5c46] underline underline-offset-2 hover:text-[#0a3d30]"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/terms"
                    className="font-bold text-[#0f5c46] underline underline-offset-2 hover:text-[#0a3d30]"
                  >
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedRole}
                className="w-full rounded-xl bg-[#0f5c46] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0f5c46]/20 transition hover:bg-[#0a3d30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting application..." : "Submit application"}
              </button>
            </form>
          </section>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[#e7e1d3] bg-[#0a3d30] text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <p className="font-arabic text-xl text-[#e6cf9a]">
                إِنَّ اللّٰهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Don't see the right role yet?
              </h2>
              <p className="mt-3 text-base leading-7 text-white/75">
                Tell us how you would like to contribute — we keep thoughtful
                introductions in mind for future openings.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#e6cf9a] px-6 py-3 text-sm font-bold text-[#0a3d30] transition hover:bg-[#f0dcae]"
            >
              Get in touch
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e7e1d3] bg-[#f7f4ec]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg" />
            <p className="font-display text-lg font-semibold text-[#0a3d30]">
              UmmahWay
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-[#4a5852]">
            <Link to="/privacy" className="hover:text-[#0f5c46]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#0f5c46]">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-[#0f5c46]">
              Contact
            </Link>
            <span className="text-[#9a8c68]">
              &copy; {new Date().getFullYear()} UmmahWay
            </span>
          </div>
        </div>
      </footer>
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
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#6b7a74]">
        {title}
      </h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[#4a5852]">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9b06a]" />
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
