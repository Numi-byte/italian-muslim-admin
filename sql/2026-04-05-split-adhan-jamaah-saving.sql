-- Allow adhan/start and jamaat times to be saved independently.
-- Keeps the same table and column names used by the app.
alter table public.masjid_prayer_times
  alter column start_time drop not null,
  alter column jamaat_time drop not null;
