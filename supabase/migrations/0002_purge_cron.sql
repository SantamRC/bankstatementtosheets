-- Daily purge of conversion history older than 30 days (privacy promise).
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('purge-expired-conversions', '0 3 * * *', $$delete from public.conversions where expires_at < now()$$);
