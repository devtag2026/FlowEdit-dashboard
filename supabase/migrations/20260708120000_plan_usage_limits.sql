-- Enforce the per-plan usage limits advertised on the pricing cards
-- (src/components/service/PlanCards.jsx) which were previously display-only:
--   starter: 2 videos/billing period, 1 revision round per video
--   pro:     8 videos/billing period, unlimited revisions
--   agency:  20 videos/billing period, unlimited revisions
--
-- All project/comment writes go through the browser Supabase client, so a
-- client-side check alone is bypassable — these triggers are the backstop.
-- Limits here are a deliberate second copy of PLAN_LIMITS in
-- src/lib/stripe/plans.js; keep both in sync when limits change.

alter table public.profiles
  add column if not exists current_period_start timestamptz;

-- ── Video limit: cap projects.insert per billing period ──
create or replace function public.enforce_video_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_window_start timestamptz;
  v_limit int;
  v_used int;
begin
  select subscription_plan, current_period_start, current_period_end
    into v_plan, v_period_start, v_period_end
  from public.profiles
  where id = new.client_id;

  v_limit := case v_plan
    when 'starter' then 2
    when 'pro' then 8
    when 'agency' then 20
    else 0
  end;

  v_window_start := coalesce(
    v_period_start,
    v_period_end - interval '1 month',
    date_trunc('month', now())
  );

  select count(*) into v_used
  from public.projects
  where client_id = new.client_id
    and created_at >= v_window_start;

  if v_used >= v_limit then
    raise exception 'video_limit_reached: % plan allows % videos per billing period', coalesce(v_plan, 'launch'), v_limit
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_video_limit on public.projects;
create trigger trg_enforce_video_limit
  before insert on public.projects
  for each row
  execute function public.enforce_video_limit();

-- ── Revision limit: cap client-initiated "Revision requested:" comments per project ──
-- Admin-initiated "Admin revision:" comments and ordinary comments are exempt.
create or replace function public.enforce_revision_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit int;
  v_used int;
begin
  if new.content not ilike 'Revision requested:%' then
    return new;
  end if;

  select p.subscription_plan into v_plan
  from public.projects pr
  join public.profiles p on p.id = pr.client_id
  where pr.id = new.project_id;

  -- Only starter caps revisions; pro/agency/others are unlimited.
  if v_plan is distinct from 'starter' then
    return new;
  end if;

  v_limit := 1;

  select count(*) into v_used
  from public.project_comments
  where project_id = new.project_id
    and content ilike 'Revision requested:%';

  if v_used >= v_limit then
    raise exception 'revision_limit_reached: starter plan allows % revision round(s) per video', v_limit
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_revision_limit on public.project_comments;
create trigger trg_enforce_revision_limit
  before insert on public.project_comments
  for each row
  execute function public.enforce_revision_limit();
