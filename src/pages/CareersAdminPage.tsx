import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { supabase } from "../lib/supabaseClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "../components/ui";
import { BriefcaseIcon, FileTextIcon, InboxIcon } from "../components/icons";

type RoleStatus = "draft" | "open" | "closed" | "archived";
type EmploymentType =
  | "full_time"
  | "part_time"
  | "contractor"
  | "volunteer"
  | "internship"
  | "temporary";
type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";
type BadgeTone = "emerald" | "slate" | "amber" | "rose" | "sky" | "violet";

type CareerRole = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  seniority: string;
  status: RoleStatus;
  summary: string;
  responsibilities: string;
  requirements: string;
  nice_to_have: string | null;
  salary_range: string | null;
  sort_order: number;
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};

type CareerApplication = {
  id: string;
  role_id: string | null;
  role_title_snapshot: string;
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
  cv_file_name: string;
  cv_file_path: string;
  cv_file_type: string;
  cv_file_size: number;
  source: string;
  status: ApplicationStatus;
  notification_status: string;
  notification_sent_at: string | null;
  notification_error: string | null;
  receipt_sent_at: string | null;
  receipt_error: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_sent_at: string | null;
  rejection_email_error: string | null;
  rejection_note: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type RoleFormState = {
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  seniority: string;
  status: RoleStatus;
  summary: string;
  responsibilities: string;
  requirements: string;
  nice_to_have: string;
  salary_range: string;
  sort_order: string;
  closes_at: string;
};

const initialRoleForm: RoleFormState = {
  title: "",
  department: "Product",
  location: "Remote / Europe",
  employment_type: "full_time",
  seniority: "Any level",
  status: "draft",
  summary: "",
  responsibilities: "",
  requirements: "",
  nice_to_have: "",
  salary_range: "",
  sort_order: "0",
  closes_at: "",
};

const employmentLabels: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractor: "Contract",
  volunteer: "Volunteer",
  internship: "Internship",
  temporary: "Temporary",
};

const roleStatusLabels: Record<RoleStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

const CareersAdminPage: React.FC = () => {
  const { session, user } = useAuth();
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [roleForm, setRoleForm] = useState<RoleFormState>(initialRoleForm);
  const [editingRole, setEditingRole] = useState<CareerRole | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [roleFilter, setRoleFilter] = useState("all");
  const [rejectionNote, setRejectionNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<
    string | null
  >(null);
  const [rejectingApplicationId, setRejectingApplicationId] = useState<
    string | null
  >(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const selectedApplication = useMemo(
    () =>
      applications.find((application) => application.id === selectedApplicationId) ??
      applications[0] ??
      null,
    [applications, selectedApplicationId]
  );

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      if (statusFilter !== "all" && application.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "all" && application.role_id !== roleFilter) {
        return false;
      }

      if (!query) return true;

      return applicationSearchValues(application).some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [applications, roleFilter, search, statusFilter]);

  const submittedCount = applications.filter(
    (application) => application.status === "submitted"
  ).length;
  const openRoleCount = roles.filter((role) => role.status === "open").length;

  const loadData = async () => {
    setLoading(true);
    setRolesError(null);
    setApplicationsError(null);

    const [rolesResult, applicationsResult] = await Promise.all([
      supabase
        .from("career_roles")
        .select(
          "id, title, department, location, employment_type, seniority, status, summary, responsibilities, requirements, nice_to_have, salary_range, sort_order, published_at, closes_at, created_at, updated_at"
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("career_applications")
        .select(
          "id, role_id, role_title_snapshot, applicant_name, applicant_email, applicant_phone, applicant_location, linkedin_url, portfolio_url, current_company, years_experience, availability, work_authorization, salary_expectation, cover_message, cv_file_name, cv_file_path, cv_file_type, cv_file_size, source, status, notification_status, notification_sent_at, notification_error, receipt_sent_at, receipt_error, reviewed_at, reviewed_by, rejection_sent_at, rejection_email_error, rejection_note, internal_notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (rolesResult.error) {
      console.error("[Careers Admin] Could not load roles", rolesResult.error);
      setRoles([]);
      setRolesError(rolesResult.error.message);
    } else {
      setRoles((rolesResult.data ?? []) as CareerRole[]);
    }

    if (applicationsResult.error) {
      console.error(
        "[Careers Admin] Could not load applications",
        applicationsResult.error
      );
      setApplications([]);
      setApplicationsError(applicationsResult.error.message);
    } else {
      const nextApplications = (applicationsResult.data ?? []) as CareerApplication[];
      setApplications(nextApplications);
      setSelectedApplicationId((current) =>
        nextApplications.some((application) => application.id === current)
          ? current
          : nextApplications[0]?.id ?? ""
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const setRoleField = (
    field: keyof RoleFormState,
    value: RoleFormState[keyof RoleFormState]
  ) => {
    setRoleForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetRoleForm = () => {
    setRoleForm(initialRoleForm);
    setEditingRole(null);
  };

  const editRole = (role: CareerRole) => {
    setEditingRole(role);
    setRoleForm({
      title: role.title,
      department: role.department,
      location: role.location,
      employment_type: role.employment_type,
      seniority: role.seniority,
      status: role.status,
      summary: role.summary,
      responsibilities: role.responsibilities,
      requirements: role.requirements,
      nice_to_have: role.nice_to_have ?? "",
      salary_range: role.salary_range ?? "",
      sort_order: String(role.sort_order ?? 0),
      closes_at: role.closes_at ?? "",
    });
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!roleForm.title.trim() || !roleForm.summary.trim()) {
      setMessage("Role title and summary are required.");
      setMessageType("error");
      return;
    }

    if (!roleForm.responsibilities.trim() || !roleForm.requirements.trim()) {
      setMessage("Responsibilities and requirements are required.");
      setMessageType("error");
      return;
    }

    setSavingRole(true);
    const now = new Date().toISOString();
    const payload = {
      title: roleForm.title.trim(),
      department: roleForm.department.trim() || "Product",
      location: roleForm.location.trim() || "Remote / Europe",
      employment_type: roleForm.employment_type,
      seniority: roleForm.seniority.trim() || "Any level",
      status: roleForm.status,
      summary: roleForm.summary.trim(),
      responsibilities: roleForm.responsibilities.trim(),
      requirements: roleForm.requirements.trim(),
      nice_to_have: roleForm.nice_to_have.trim() || null,
      salary_range: roleForm.salary_range.trim() || null,
      sort_order: Number(roleForm.sort_order) || 0,
      closes_at: roleForm.closes_at || null,
      published_at:
        roleForm.status === "open"
          ? editingRole?.published_at ?? now
          : editingRole?.published_at ?? null,
      updated_by: user?.id ?? null,
    };

    const result = editingRole
      ? await supabase.from("career_roles").update(payload).eq("id", editingRole.id)
      : await supabase.from("career_roles").insert({
          ...payload,
          created_by: user?.id ?? null,
        });

    if (result.error) {
      setMessage(result.error.message);
      setMessageType("error");
    } else {
      setMessage(editingRole ? "Role updated." : "Role created.");
      setMessageType("success");
      resetRoleForm();
      await loadData();
    }

    setSavingRole(false);
  };

  const setRoleStatus = async (role: CareerRole, status: RoleStatus) => {
    setMessage(null);
    setMessageType(null);

    const payload = {
      status,
      updated_by: user?.id ?? null,
      published_at:
        status === "open"
          ? role.published_at ?? new Date().toISOString()
          : role.published_at,
    };

    const { error } = await supabase
      .from("career_roles")
      .update(payload)
      .eq("id", role.id);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    setRoles((prev) =>
      prev.map((item) =>
        item.id === role.id
          ? {
              ...item,
              status,
              published_at: payload.published_at,
            }
          : item
      )
    );
    setMessage(status === "closed" ? "Role closed." : "Role status updated.");
    setMessageType("success");
  };

  const updateApplicationStatus = async (
    application: CareerApplication,
    status: ApplicationStatus
  ) => {
    if (status === "rejected") return;

    setUpdatingApplicationId(application.id);
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase
      .from("career_applications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", application.id);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id ?? null,
              }
            : item
        )
      );
      setMessage("Application updated.");
      setMessageType("success");
    }

    setUpdatingApplicationId(null);
  };

  const rejectApplication = async (application: CareerApplication) => {
    const token = session?.access_token;
    if (!token) {
      setMessage("Admin session is not available.");
      setMessageType("error");
      return;
    }

    setRejectingApplicationId(application.id);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch("/api/careers-admin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject_application",
          application_id: application.id,
          rejection_note: rejectionNote.trim(),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(result?.error ?? "Could not reject this applicant.");
        setMessageType("error");
      } else {
        setMessage("Applicant rejected and email sent.");
        setMessageType("success");
        setRejectionNote("");
        await loadData();
      }
    } finally {
      setRejectingApplicationId(null);
    }
  };

  const openCv = async (application: CareerApplication) => {
    const token = session?.access_token;
    if (!token) {
      setMessage("Admin session is not available.");
      setMessageType("error");
      return;
    }

    setOpeningCvId(application.id);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await fetch(
        `/api/career-cv?application_id=${encodeURIComponent(application.id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !result?.url) {
        setMessage(result?.error ?? "Could not open this CV.");
        setMessageType("error");
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningCvId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm leading-6 text-slate-500">
            Create public roles, close them when hiring stops, and manage CV
            submissions from one private area.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void loadData()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {message && (
        <Alert tone={messageType === "success" ? "success" : "error"}>
          {message}
        </Alert>
      )}

      {(rolesError || applicationsError) && (
        <Alert tone="error">
          {rolesError || applicationsError}
          <span className="mt-1 block text-[11px] opacity-80">
            Apply sql/2026-07-27-careers.sql in Supabase if this is the first
            time enabling careers.
          </span>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Open roles
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {openRoleCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            New applications
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {submittedCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total candidates
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {applications.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <BriefcaseIcon width={18} height={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingRole ? "Edit role" : "Create role"}
                </h3>
                <p className="text-xs text-slate-500">
                  Open roles appear on the public careers page.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={saveRole} className="space-y-4 p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title *">
                <Input
                  value={roleForm.title}
                  onChange={(event) => setRoleField("title", event.target.value)}
                  placeholder="Product Designer"
                />
              </Field>
              <Field label="Department">
                <Input
                  value={roleForm.department}
                  onChange={(event) =>
                    setRoleField("department", event.target.value)
                  }
                />
              </Field>
              <Field label="Location">
                <Input
                  value={roleForm.location}
                  onChange={(event) =>
                    setRoleField("location", event.target.value)
                  }
                />
              </Field>
              <Field label="Employment type">
                <Select
                  value={roleForm.employment_type}
                  onChange={(event) =>
                    setRoleField(
                      "employment_type",
                      event.target.value as EmploymentType
                    )
                  }
                >
                  {Object.entries(employmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Seniority">
                <Input
                  value={roleForm.seniority}
                  onChange={(event) =>
                    setRoleField("seniority", event.target.value)
                  }
                />
              </Field>
              <Field label="Salary range">
                <Input
                  value={roleForm.salary_range}
                  onChange={(event) =>
                    setRoleField("salary_range", event.target.value)
                  }
                  placeholder="Optional"
                />
              </Field>
              <Field label="Status">
                <Select
                  value={roleForm.status}
                  onChange={(event) =>
                    setRoleField("status", event.target.value as RoleStatus)
                  }
                >
                  {Object.entries(roleStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Closes on">
                <Input
                  type="date"
                  value={roleForm.closes_at}
                  onChange={(event) =>
                    setRoleField("closes_at", event.target.value)
                  }
                />
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={roleForm.sort_order}
                  onChange={(event) =>
                    setRoleField("sort_order", event.target.value)
                  }
                />
              </Field>
            </div>

            <Field label="Summary *">
              <Textarea
                value={roleForm.summary}
                onChange={(event) =>
                  setRoleField("summary", event.target.value)
                }
                className="min-h-24"
              />
            </Field>
            <Field label="Responsibilities *">
              <Textarea
                value={roleForm.responsibilities}
                onChange={(event) =>
                  setRoleField("responsibilities", event.target.value)
                }
                className="min-h-28"
                placeholder="One point per line"
              />
            </Field>
            <Field label="Requirements *">
              <Textarea
                value={roleForm.requirements}
                onChange={(event) =>
                  setRoleField("requirements", event.target.value)
                }
                className="min-h-28"
                placeholder="One point per line"
              />
            </Field>
            <Field label="Nice to have">
              <Textarea
                value={roleForm.nice_to_have}
                onChange={(event) =>
                  setRoleField("nice_to_have", event.target.value)
                }
                className="min-h-20"
              />
            </Field>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetRoleForm}>
                {editingRole ? "Cancel edit" : "Clear"}
              </Button>
              <Button type="submit" disabled={savingRole}>
                {savingRole
                  ? "Saving..."
                  : editingRole
                    ? "Save role"
                    : "Create role"}
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 p-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">
              Roles
            </h4>
            {roles.length === 0 ? (
              <EmptyState
                icon={<BriefcaseIcon />}
                title="No roles yet"
                description="Create the first role to start receiving applications."
              />
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {role.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {role.department} / {role.location}
                        </div>
                      </div>
                      <Badge tone={roleStatusTone(role.status)}>
                        {roleStatusLabels[role.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {employmentLabels[role.employment_type]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {role.seniority}
                      </span>
                      {role.closes_at && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                          Closes {formatDate(role.closes_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => editRole(role)}>
                        Edit
                      </Button>
                      {role.status === "open" ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void setRoleStatus(role, "closed")}
                        >
                          Close role
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => void setRoleStatus(role, "open")}
                          disabled={role.status === "archived"}
                        >
                          Open role
                        </Button>
                      )}
                      {role.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void setRoleStatus(role, "archived")}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  <InboxIcon width={18} height={18} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Applications
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review candidate details, open CVs, and reject by email.
                  </p>
                </div>
              </div>
              {loading && <Spinner />}
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-2 md:grid-cols-[1fr_150px_180px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, role, location..."
              />
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ApplicationStatus | "all")
                }
              >
                <option value="all">All statuses</option>
                {Object.entries(applicationStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </Select>
            </div>

            {filteredApplications.length === 0 ? (
              <EmptyState
                icon={<InboxIcon />}
                title="No matching applications"
                description="Submitted career applications will appear here."
              />
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {filteredApplications.map((application) => {
                  const selected = selectedApplication?.id === application.id;
                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => setSelectedApplicationId(application.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">
                            {application.applicant_name}
                          </div>
                          <div className="truncate text-[11px] text-slate-500">
                            {application.role_title_snapshot} /{" "}
                            {application.applicant_location}
                          </div>
                        </div>
                        <Badge tone={applicationStatusTone(application.status)}>
                          {applicationStatusLabels[application.status]}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {formatDateTime(application.created_at)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {application.cv_file_name}
                        </span>
                        {application.rejection_sent_at && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                            rejection emailed
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {selectedApplication && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <FileTextIcon width={18} height={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {selectedApplication.applicant_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedApplication.role_title_snapshot} / submitted{" "}
                  {formatDateTime(selectedApplication.created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void openCv(selectedApplication)}
                disabled={openingCvId === selectedApplication.id}
              >
                {openingCvId === selectedApplication.id ? "Opening..." : "Open CV"}
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() =>
                  void updateApplicationStatus(selectedApplication, "reviewing")
                }
                disabled={updatingApplicationId === selectedApplication.id}
              >
                Mark reviewing
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() =>
                  void updateApplicationStatus(selectedApplication, "shortlisted")
                }
                disabled={updatingApplicationId === selectedApplication.id}
              >
                Shortlist
              </Button>
              <Button
                size="sm"
                variant="subtle"
                onClick={() =>
                  void updateApplicationStatus(selectedApplication, "hired")
                }
                disabled={updatingApplicationId === selectedApplication.id}
              >
                Hire
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-5">
              <DetailGroup
                title="Candidate"
                rows={[
                  ["Email", selectedApplication.applicant_email],
                  ["Phone", selectedApplication.applicant_phone],
                  ["Location", selectedApplication.applicant_location],
                  ["LinkedIn", selectedApplication.linkedin_url],
                  ["Portfolio", selectedApplication.portfolio_url],
                  ["Current company", selectedApplication.current_company],
                  ["Experience", selectedApplication.years_experience],
                  ["Availability", selectedApplication.availability],
                  ["Work authorization", selectedApplication.work_authorization],
                  ["Salary expectation", selectedApplication.salary_expectation],
                ]}
              />
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cover message
                </h4>
                <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedApplication.cover_message}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <DetailGroup
                title="Application"
                rows={[
                  [
                    "Status",
                    applicationStatusLabels[selectedApplication.status],
                  ],
                  ["Reference", selectedApplication.id],
                  ["Role", selectedApplication.role_title_snapshot],
                  ["Source", selectedApplication.source],
                  ["CV file", selectedApplication.cv_file_name],
                  ["CV size", formatBytes(selectedApplication.cv_file_size)],
                  ["Receipt", selectedApplication.receipt_sent_at ? "Sent" : "Pending"],
                  [
                    "Admin notification",
                    selectedApplication.notification_status,
                  ],
                  [
                    "Rejected email",
                    selectedApplication.rejection_sent_at
                      ? formatDateTime(selectedApplication.rejection_sent_at)
                      : "Not sent",
                  ],
                ]}
              />

              {(selectedApplication.notification_error ||
                selectedApplication.receipt_error ||
                selectedApplication.rejection_email_error) && (
                <Alert tone="warning">
                  {selectedApplication.notification_error ??
                    selectedApplication.receipt_error ??
                    selectedApplication.rejection_email_error}
                </Alert>
              )}

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h4 className="text-sm font-semibold text-rose-900">
                  Reject applicant
                </h4>
                <p className="mt-1 text-xs leading-5 text-rose-700">
                  Sends the professional rejection email immediately and marks
                  the application rejected.
                </p>
                <Textarea
                  value={rejectionNote}
                  onChange={(event) => setRejectionNote(event.target.value)}
                  className="mt-3 min-h-20 border-rose-200 bg-white focus:border-rose-300 focus:ring-rose-400/20"
                  placeholder="Optional private note"
                />
                <Button
                  className="mt-3 w-full"
                  variant="danger"
                  onClick={() => void rejectApplication(selectedApplication)}
                  disabled={rejectingApplicationId === selectedApplication.id}
                >
                  {rejectingApplicationId === selectedApplication.id
                    ? "Rejecting..."
                    : "Reject and email"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const DetailGroup: React.FC<{
  title: string;
  rows: Array<[string, string | null | undefined]>;
}> = ({ title, rows }) => {
  const visibleRows = rows.filter(([, value]) => present(value));
  if (visibleRows.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <dl className="grid gap-2 sm:grid-cols-2">
        {visibleRows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm text-slate-700">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

function applicationSearchValues(application: CareerApplication) {
  return [
    application.id,
    application.role_title_snapshot,
    application.applicant_name,
    application.applicant_email,
    application.applicant_phone,
    application.applicant_location,
    application.linkedin_url,
    application.portfolio_url,
    application.current_company,
    application.years_experience,
    application.availability,
    application.work_authorization,
    application.salary_expectation,
    application.status,
    application.cv_file_name,
  ]
    .map(present)
    .filter((value): value is string => Boolean(value));
}

function present(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function roleStatusTone(status: RoleStatus): BadgeTone {
  if (status === "open") return "emerald";
  if (status === "closed") return "amber";
  if (status === "archived") return "slate";
  return "sky";
}

function applicationStatusTone(status: ApplicationStatus): BadgeTone {
  if (status === "submitted") return "amber";
  if (status === "reviewing") return "sky";
  if (status === "shortlisted") return "violet";
  if (status === "hired") return "emerald";
  if (status === "rejected") return "rose";
  return "slate";
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default CareersAdminPage;
