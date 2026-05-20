alter table public.masjid_prayer_times
  add column if not exists asr_start_time_shafi time without time zone null,
  add column if not exists asr_start_time_hanafi time without time zone null;

comment on column public.masjid_prayer_times.start_time is
  'Adhan/start time for all prayers. For asr, legacy fallback value when madhab-specific columns are not set.';

comment on column public.masjid_prayer_times.asr_start_time_shafi is
  'Asr adhan/start time calculated with Shafi method.';

comment on column public.masjid_prayer_times.asr_start_time_hanafi is
  'Asr adhan/start time calculated with Hanafi method.';

update public.masjid_prayer_times
set asr_start_time_shafi = coalesce(asr_start_time_shafi, start_time)
where prayer = 'asr';

alter table public.masjid_prayer_times
  drop constraint if exists masjid_prayer_times_asr_method_chk;

alter table public.masjid_prayer_times
  add constraint masjid_prayer_times_asr_method_chk check (
    (
      prayer = 'asr'
      and (asr_start_time_shafi is not null or asr_start_time_hanafi is not null)
    )
    or (
      prayer <> 'asr'
      and asr_start_time_shafi is null
      and asr_start_time_hanafi is null
    )
  );
