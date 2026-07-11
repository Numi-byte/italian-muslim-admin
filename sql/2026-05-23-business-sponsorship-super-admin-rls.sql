-- Business sponsorship RLS for the UmmahWay super admin.
--
-- This keeps digital_register_users completely separate. Sponsorship leads and
-- sponsored ads are managed only by the admin app's super_admin user.
--
-- Public behavior preserved:
-- - the website submits business sponsorship applications through the
--   server-only /api/business-sponsorship route
-- - anyone can read currently active prayer-page sponsored ads

alter table public.business_sponsorship_applications
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists notification_sent_at timestamptz,
  add column if not exists last_notification_error text;

alter table public.business_sponsorship_applications enable row level security;
alter table public.prayer_sponsored_ads enable row level security;

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

drop policy if exists "Anyone can submit sponsorship applications"
  on public.business_sponsorship_applications;
drop policy if exists "Authenticated users can submit own sponsorship applications"
  on public.business_sponsorship_applications;
create policy "Authenticated users can submit own sponsorship applications"
  on public.business_sponsorship_applications
  for insert
  to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'new'
    and internal_notes is null
    and reviewed_at is null
    and reviewed_by is null
    and notification_sent_at is null
    and last_notification_error is null
  );

drop policy if exists "Super admin can manage sponsorship applications"
  on public.business_sponsorship_applications;
drop policy if exists "Admins can manage sponsorship applications"
  on public.business_sponsorship_applications;
create policy "Super admin can manage sponsorship applications"
  on public.business_sponsorship_applications
  for all
  to authenticated
  using (public.is_ummahway_super_admin())
  with check (public.is_ummahway_super_admin());

drop policy if exists "Anyone can read active prayer sponsored ads"
  on public.prayer_sponsored_ads;
create policy "Anyone can read active prayer sponsored ads"
  on public.prayer_sponsored_ads
  for select
  to anon, authenticated
  using (
    status = 'active'
    and starts_on <= current_date
    and (ends_on is null or ends_on >= current_date)
  );

drop policy if exists "Super admin can manage prayer sponsored ads"
  on public.prayer_sponsored_ads;
drop policy if exists "Admins can manage prayer sponsored ads"
  on public.prayer_sponsored_ads;
create policy "Super admin can manage prayer sponsored ads"
  on public.prayer_sponsored_ads
  for all
  to authenticated
  using (public.is_ummahway_super_admin())
  with check (public.is_ummahway_super_admin());
