-- Enable pg_cron for scheduled jobs
-- Run this after enabling the pg_cron extension in your Supabase dashboard

-- Note: pg_cron must be enabled via Supabase Dashboard > Database > Extensions

-- Schedule rent reminders: daily at 9am UTC
select cron.schedule(
  'rent-reminders',
  '0 9 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/rent-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule late fees: daily at 10am UTC
select cron.schedule(
  'late-fees',
  '0 10 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/late-fees',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule syndication queue: every 30 minutes
select cron.schedule(
  'syndication-queue',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/syndication-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Monthly rent payment creation
-- Runs on the 1st of every month to create pending payment records for active leases
select cron.schedule(
  'create-monthly-payments',
  '0 0 1 * *',
  $$
  insert into public.payments (lease_id, renter_id, landlord_id, amount, type, status, due_date)
  select
    l.id,
    l.renter_id,
    l.landlord_id,
    l.rent_amount,
    'rent',
    'pending',
    date_trunc('month', now()) + ((l.payment_due_day - 1) || ' days')::interval
  from public.leases l
  where l.status = 'active'
    and l.end_date > now()
    and not exists (
      select 1 from public.payments p
      where p.lease_id = l.id
        and p.type = 'rent'
        and date_trunc('month', p.due_date) = date_trunc('month', now())
    );
  $$
);
