-- Careers roles and applications for UmmahWay.
-- Apply this in Supabase before publishing /careers in production.

create extension if not exists pgcrypto;

create table if not exists public.edge_rate_limits (
  scope text not null,
  subject text not null,
  bucket_start timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, subject, bucket_start)
);

alter table public.edge_rate_limits enable row level security;
revoke all on public.edge_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.edge_rate_limits to service_role;

create or replace function public.consume_edge_rate_limit(
  p_scope text,
  p_subject text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket_start timestamptz;
  v_attempts integer;
begin
  if p_scope is null
    or length(trim(p_scope)) = 0
    or p_subject is null
    or length(trim(p_subject)) = 0
    or p_max_attempts < 1
    or p_window_seconds < 1
  then
    return false;
  end if;

  v_bucket_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.edge_rate_limits (
    scope,
    subject,
    bucket_start,
    attempts
  )
  values (
    p_scope,
    p_subject,
    v_bucket_start,
    1
  )
  on conflict (scope, subject, bucket_start)
  do update set
    attempts = public.edge_rate_limits.attempts + 1,
    updated_at = now()
  returning attempts into v_attempts;

  delete from public.edge_rate_limits
  where bucket_start < now() - interval '14 days';

  return v_attempts <= p_max_attempts;
end;
$$;

revoke execute on function public.consume_edge_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_edge_rate_limit(text, text, integer, integer)
  to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_ummahway_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid() = 'e4d243f9-9b01-42d4-8dec-f1826bfe74ca'::uuid
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    );
$$;

grant execute on function public.is_ummahway_super_admin() to authenticated;

create table if not exists public.career_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default 'Operations',
  location text not null default 'Remote / Europe',
  employment_type text not null default 'full_time' check (
    employment_type in (
      'full_time',
      'part_time',
      'contractor',
      'volunteer',
      'internship',
      'temporary'
    )
  ),
  seniority text not null default 'Any level',
  status text not null default 'draft' check (
    status in ('draft', 'open', 'closed', 'archived')
  ),
  summary text not null,
  responsibilities text not null default '',
  requirements text not null default '',
  nice_to_have text,
  salary_range text,
  sort_order integer not null default 0,
  published_at timestamptz,
  closes_at date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_roles_lengths_chk check (
    length(title) between 2 and 180
    and length(department) between 1 and 120
    and length(location) between 1 and 160
    and length(employment_type) between 1 and 40
    and length(seniority) between 1 and 120
    and length(summary) between 20 and 1800
    and length(responsibilities) <= 6000
    and length(requirements) <= 6000
    and length(coalesce(nice_to_have, '')) <= 4000
    and length(coalesce(salary_range, '')) <= 120
  )
);

create index if not exists career_roles_public_idx
  on public.career_roles (status, sort_order, published_at desc);

create index if not exists career_roles_updated_idx
  on public.career_roles (updated_at desc);

drop trigger if exists career_roles_set_updated_at
  on public.career_roles;
create trigger career_roles_set_updated_at
before update on public.career_roles
for each row execute function public.set_updated_at();

create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.career_roles(id) on delete set null,
  role_title_snapshot text not null,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text not null,
  applicant_location text not null,
  linkedin_url text,
  portfolio_url text,
  current_company text,
  years_experience text,
  availability text not null,
  work_authorization text not null,
  salary_expectation text,
  cover_message text not null,
  cv_file_name text not null,
  cv_file_path text not null,
  cv_file_type text not null,
  cv_file_size integer not null,
  source text not null default 'website',
  status text not null default 'submitted' check (
    status in (
      'submitted',
      'reviewing',
      'shortlisted',
      'rejected',
      'hired',
      'withdrawn'
    )
  ),
  consent_privacy boolean not null,
  consent_contact boolean not null,
  user_agent text,
  notification_status text not null default 'received' check (
    notification_status in ('received', 'email_sent', 'email_failed')
  ),
  notification_sent_at timestamptz,
  notification_error text,
  receipt_sent_at timestamptz,
  receipt_error text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_sent_at timestamptz,
  rejection_email_error text,
  rejection_note text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_applications_email_chk
    check (applicant_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint career_applications_cv_size_chk
    check (cv_file_size > 0 and cv_file_size <= 5242880),
  constraint career_applications_lengths_chk check (
    length(role_title_snapshot) between 2 and 180
    and length(applicant_name) between 2 and 160
    and length(applicant_email) between 3 and 320
    and length(applicant_phone) between 3 and 80
    and length(applicant_location) between 2 and 160
    and length(coalesce(linkedin_url, '')) <= 500
    and length(coalesce(portfolio_url, '')) <= 500
    and length(coalesce(current_company, '')) <= 160
    and length(coalesce(years_experience, '')) <= 80
    and length(availability) between 2 and 160
    and length(work_authorization) between 2 and 220
    and length(coalesce(salary_expectation, '')) <= 120
    and length(cover_message) between 20 and 4000
    and length(cv_file_name) between 3 and 240
    and length(cv_file_path) between 8 and 600
    and length(cv_file_type) between 3 and 160
    and length(source) between 1 and 80
    and length(coalesce(user_agent, '')) <= 500
    and length(coalesce(notification_error, '')) <= 1000
    and length(coalesce(receipt_error, '')) <= 1000
    and length(coalesce(rejection_email_error, '')) <= 1000
    and length(coalesce(rejection_note, '')) <= 1500
    and length(coalesce(internal_notes, '')) <= 4000
  )
);

create index if not exists career_applications_created_idx
  on public.career_applications (created_at desc);

create index if not exists career_applications_status_idx
  on public.career_applications (status, created_at desc);

create index if not exists career_applications_role_idx
  on public.career_applications (role_id, created_at desc)
  where role_id is not null;

drop trigger if exists career_applications_set_updated_at
  on public.career_applications;
create trigger career_applications_set_updated_at
before update on public.career_applications
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-cvs',
  'career-cvs',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.career_roles enable row level security;
alter table public.career_applications enable row level security;

revoke all on public.career_roles from public, anon, authenticated;
revoke all on public.career_applications from public, anon, authenticated;

grant select on public.career_roles to anon, authenticated;
grant insert, update, delete on public.career_roles to authenticated;
grant select, insert, update, delete on public.career_roles to service_role;

grant select, update, delete on public.career_applications to authenticated;
grant select, insert, update, delete on public.career_applications to service_role;

drop policy if exists "Anyone can read open career roles"
  on public.career_roles;
create policy "Anyone can read open career roles"
  on public.career_roles
  for select
  to anon, authenticated
  using (
    status = 'open'
    and (published_at is null or published_at <= now())
    and (closes_at is null or closes_at >= current_date)
  );

drop policy if exists "Super admin can manage career roles"
  on public.career_roles;
create policy "Super admin can manage career roles"
  on public.career_roles
  for all
  to authenticated
  using (public.is_ummahway_super_admin())
  with check (public.is_ummahway_super_admin());

drop policy if exists "Super admin can manage career applications"
  on public.career_applications;
create policy "Super admin can manage career applications"
  on public.career_applications
  for all
  to authenticated
  using (public.is_ummahway_super_admin())
  with check (public.is_ummahway_super_admin());
