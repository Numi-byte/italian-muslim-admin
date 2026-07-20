-- Support contact form storage for UmmahWay admin/public web.
-- Apply this before enabling /api/contact in production.

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

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null default 'support@ummahway.com',
  user_id uuid references auth.users(id) on delete set null,
  account_email text,
  contact_name text not null,
  contact_email text not null,
  topic text not null check (
    topic in (
      'purchase',
      'login_access',
      'masjid_timings',
      'technical',
      'privacy',
      'other'
    )
  ),
  subject text not null,
  message text not null,
  source text not null default 'web',
  page_url text,
  user_agent text,
  status text not null default 'received' check (
    status in ('received', 'email_sent', 'email_failed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_messages_contact_email_chk
    check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint support_messages_lengths_chk check (
    length(recipient_email) <= 320
    and length(coalesce(account_email, '')) <= 320
    and length(contact_name) between 1 and 120
    and length(contact_email) between 3 and 320
    and length(topic) between 1 and 80
    and length(subject) between 1 and 160
    and length(message) between 1 and 5000
    and length(source) between 1 and 80
    and length(coalesce(page_url, '')) <= 500
    and length(coalesce(user_agent, '')) <= 500
  )
);

create index if not exists support_messages_created_idx
  on public.support_messages (created_at desc);

create index if not exists support_messages_user_created_idx
  on public.support_messages (user_id, created_at desc)
  where user_id is not null;

drop trigger if exists support_messages_set_updated_at
  on public.support_messages;
create trigger support_messages_set_updated_at
before update on public.support_messages
for each row execute function public.set_updated_at();

alter table public.support_messages enable row level security;
revoke all on public.support_messages from public, anon, authenticated;
grant select, insert, update, delete on public.support_messages to service_role;
