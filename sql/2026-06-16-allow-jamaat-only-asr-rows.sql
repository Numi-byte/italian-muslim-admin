-- Allow jamaat-only rows for Asr.
-- Limited jamaat editors can create rows before official Asr start times exist.

alter table public.masjid_prayer_times
  drop constraint if exists masjid_prayer_times_asr_method_chk;

alter table public.masjid_prayer_times
  add constraint masjid_prayer_times_asr_method_chk check (
    prayer = 'asr'
    or (
      prayer <> 'asr'
      and asr_start_time_shafi is null
      and asr_start_time_hanafi is null
    )
  );
