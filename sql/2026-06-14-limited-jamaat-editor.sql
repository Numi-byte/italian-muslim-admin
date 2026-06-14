-- Allow one authenticated user to edit only daily jamaat timings for one masjid.
-- The trigger is the critical guard: it rejects changes to any other masjid or
-- to adhan/start-time columns for this limited editor.

create or replace function public.can_edit_limited_jamaat_times(target_masjid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = '24dcca75-577b-4d7d-8177-5932e85170e7'::uuid
    and target_masjid_id = '4be0c02c-0b29-4c28-8547-f449b49bd619'::uuid;
$$;

grant execute on function public.can_edit_limited_jamaat_times(uuid)
  to authenticated;

create or replace function public.is_limited_jamaat_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = '24dcca75-577b-4d7d-8177-5932e85170e7'::uuid;
$$;

grant execute on function public.is_limited_jamaat_editor()
  to authenticated;

create or replace function public.enforce_limited_jamaat_editor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_limited_jamaat_editor() then
    return new;
  end if;

  if not public.can_edit_limited_jamaat_times(new.masjid_id) then
    raise exception 'Limited jamaat editor cannot change this masjid';
  end if;

  if tg_op = 'INSERT' then
    if new.start_time is not null
      or new.asr_start_time_shafi is not null
      or new.asr_start_time_hanafi is not null then
      raise exception 'Limited jamaat editors can only set jamaat_time';
    end if;

    return new;
  end if;

  if (to_jsonb(new) - 'jamaat_time' - 'updated_at')
    is distinct from (to_jsonb(old) - 'jamaat_time' - 'updated_at') then
    raise exception 'Limited jamaat editors can only change jamaat_time';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_limited_jamaat_editor
  on public.masjid_prayer_times;
create trigger enforce_limited_jamaat_editor
  before insert or update on public.masjid_prayer_times
  for each row
  execute function public.enforce_limited_jamaat_editor();

alter table public.masjid_prayer_times enable row level security;

drop policy if exists "Anyone can read masjid prayer times"
  on public.masjid_prayer_times;
create policy "Anyone can read masjid prayer times"
  on public.masjid_prayer_times
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Super admin can manage masjid prayer times"
  on public.masjid_prayer_times;
create policy "Super admin can manage masjid prayer times"
  on public.masjid_prayer_times
  for all
  to authenticated
  using (public.is_ummahway_super_admin())
  with check (public.is_ummahway_super_admin());

drop policy if exists "Limited jamaat editor can insert assigned prayer times"
  on public.masjid_prayer_times;
create policy "Limited jamaat editor can insert assigned prayer times"
  on public.masjid_prayer_times
  for insert
  to authenticated
  with check (public.can_edit_limited_jamaat_times(masjid_id));

drop policy if exists "Limited jamaat editor can update assigned prayer times"
  on public.masjid_prayer_times;
create policy "Limited jamaat editor can update assigned prayer times"
  on public.masjid_prayer_times
  for update
  to authenticated
  using (public.can_edit_limited_jamaat_times(masjid_id))
  with check (public.can_edit_limited_jamaat_times(masjid_id));
