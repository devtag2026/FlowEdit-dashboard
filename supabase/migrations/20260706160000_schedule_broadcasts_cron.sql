-- Schedules a recurring check for overdue scheduled broadcasts, run entirely
-- inside Postgres via pg_cron, firing an HTTP call via pg_net to the app's
-- /api/cron/send-scheduled-broadcasts route (src/app/api/cron/send-scheduled-broadcasts/route.js).
--
-- Prerequisite (not done by this migration, must be set up once per project
-- via Supabase Dashboard -> Database -> Vault): a secret named 'cron_secret'
-- holding the same value as the app's CRON_SECRET env var. The route rejects
-- any request whose Authorization header doesn't match that value.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-scheduled-broadcasts',
  '*/5 * * * *', -- every 5 minutes
  $$
  select net.http_post(
    url := 'https://flow-edit-dashboard.vercel.app/api/cron/send-scheduled-broadcasts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body := jsonb_build_object('triggered_at', now())
  ) as request_id;
  $$
);
