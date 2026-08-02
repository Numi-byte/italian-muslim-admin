-- Add one more authenticated user to the limited jamaat editor allowlist.
-- This keeps the same restriction as the existing setup:
-- the user can only insert/update jamaat_time for the assigned masjid.

create or replace function public.can_edit_limited_jamaat_times(target_masjid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from (
      values
        (
          '24dcca75-577b-4d7d-8177-5932e85170e7'::uuid,
          '4be0c02c-0b29-4c28-8547-f449b49bd619'::uuid
        ),
        (
          'f9bdb476-5715-471f-b276-102bcf8af214'::uuid,
          '65667aba-156a-4815-9107-b76aec55e7a3'::uuid
        ),
        (
          'c6956152-baf0-4d67-8951-551820b81015'::uuid,
          'dd7198bd-0663-4d04-9f01-8d0d47de3e23'::uuid
        )
    ) as allowed(user_id, masjid_id)
    where allowed.user_id = auth.uid()
      and allowed.masjid_id = target_masjid_id
  );
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
  select auth.uid() in (
    '24dcca75-577b-4d7d-8177-5932e85170e7'::uuid,
    'f9bdb476-5715-471f-b276-102bcf8af214'::uuid,
    'c6956152-baf0-4d67-8951-551820b81015'::uuid
  );
$$;

grant execute on function public.is_limited_jamaat_editor()
  to authenticated;
