-- Support inbox: tickets that appear on the challenge page during a stage (release_min after the stage opens),
-- or earlier when the host releases one. Content comes from the private content pack (never seeded here).
create table if not exists public.obp_tickets (
  id text primary key,
  stage_id int not null references public.obp_stages(id),
  release_min int not null default 0,
  sort int not null default 0,
  from_label text not null default '',
  title text not null,
  body_md text not null default '',
  released_at timestamptz
);

-- Released tickets, newest first: { id, from, title, body_md, released_at }
create or replace function public.obp_released_tickets()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.released_at desc, x.sort desc), '[]'::jsonb) from (
    select t.id, t.from_label as "from", t.title, t.body_md, t.sort,
           least(coalesce(t.released_at, 'infinity'::timestamptz),
                 case when s.started_at is null then 'infinity'::timestamptz
                      else s.started_at + make_interval(mins => t.release_min) end) as released_at
    from public.obp_tickets t join public.obp_stages s on s.id = t.stage_id
  ) x where x.released_at <= now();
$$;

-- Admin view: every ticket with its scheduled and effective release time
create or replace function public.obp_admin_tickets()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'stage_id', t.stage_id, 'release_min', t.release_min, 'from', t.from_label, 'title', t.title,
    'manual_release', t.released_at,
    'scheduled_at', case when s.started_at is null then null else s.started_at + make_interval(mins => t.release_min) end
  ) order by t.stage_id, t.release_min, t.sort), '[]'::jsonb)
  from public.obp_tickets t join public.obp_stages s on s.id = t.stage_id;
$$;

create or replace function public.obp_release_ticket(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.obp_tickets set released_at = now() where id = p_id and released_at is null;
end $$;

-- Import (replace all tickets) from the content pack: [{ id, stage_id, release_min, from, title, body_md }]
create or replace function public.obp_import_tickets(p jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.obp_tickets where true;
  insert into public.obp_tickets (id, stage_id, release_min, sort, from_label, title, body_md)
  select x->>'id', (x->>'stage_id')::int, coalesce((x->>'release_min')::int, 0), ord::int,
         coalesce(x->>'from', ''), x->>'title', coalesce(x->>'body_md', '')
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) with ordinality as e(x, ord);
  get diagnostics n = row_count;
  return n;
end $$;

-- Reset also clears manual releases
create or replace function public.obp_reset_event()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.obp_teams where true;
  delete from public.obp_announcements where true;
  update public.obp_stages set status = 'locked', started_at = null, ends_at = null where true;
  update public.obp_tickets set released_at = null where true;
  update public.obp_settings set current_stage = 0, leaderboard_frozen = false, frozen_snapshot = null, frozen_at = null,
    exam_open = false, exam_review_open = false, registration_open = true, updated_at = now() where id = 1;
  update public.challenges set state = 'not_started', start_at = null, end_at = null, paused_at = null where slug = 'broken-prod';
end $$;

do $$
declare r record;
begin
  for r in select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname like 'obp\_%' and c.relkind in ('r','v') loop
    if r.relkind = 'r' then execute format('alter table public.%I enable row level security', r.relname); end if;
    execute format('revoke all on public.%I from public, anon, authenticated', r.relname);
    execute format('grant all on public.%I to service_role', r.relname);
  end loop;
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'obp\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
