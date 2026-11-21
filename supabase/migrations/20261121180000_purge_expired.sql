-- Delete unclaimed anonymous houses after their 7-day expiry, nightly at 03:17 UTC.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-expired-anonymous-houses',
  '17 3 * * *',
  $$delete from public.houses where owner_id is null and expires_at < now()$$
);
