-- Support inbox: severity as reported by the sender (P1 critical · P2 high · P3 normal).
alter table public.obp_tickets add column if not exists severity text not null default 'P3';

create or replace function public.obp_released_tickets()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.released_at desc, x.sort desc), '[]'::jsonb) from (
    select t.id, t.from_label as "from", t.title, t.body_md, t.severity, t.sort,
           least(coalesce(t.released_at, 'infinity'::timestamptz),
                 case when s.started_at is null then 'infinity'::timestamptz
                      else s.started_at + make_interval(mins => t.release_min) end) as released_at
    from public.obp_tickets t join public.obp_stages s on s.id = t.stage_id
  ) x where x.released_at <= now();
$$;

create or replace function public.obp_admin_tickets()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'stage_id', t.stage_id, 'release_min', t.release_min, 'from', t.from_label, 'title', t.title,
    'severity', t.severity, 'manual_release', t.released_at,
    'scheduled_at', case when s.started_at is null then null else s.started_at + make_interval(mins => t.release_min) end
  ) order by t.stage_id, t.release_min, t.sort), '[]'::jsonb)
  from public.obp_tickets t join public.obp_stages s on s.id = t.stage_id;
$$;

create or replace function public.obp_import_tickets(p jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.obp_tickets where true;
  insert into public.obp_tickets (id, stage_id, release_min, sort, from_label, title, body_md, severity)
  select x->>'id', (x->>'stage_id')::int, coalesce((x->>'release_min')::int, 0), ord::int,
         coalesce(x->>'from', ''), x->>'title', coalesce(x->>'body_md', ''),
         case when x->>'severity' in ('P1','P2','P3') then x->>'severity' else 'P3' end
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) with ordinality as e(x, ord);
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.obp_released_tickets() from public, anon, authenticated;
revoke all on function public.obp_admin_tickets() from public, anon, authenticated;
revoke all on function public.obp_import_tickets(jsonb) from public, anon, authenticated;
grant execute on function public.obp_released_tickets() to service_role;
grant execute on function public.obp_admin_tickets() to service_role;
grant execute on function public.obp_import_tickets(jsonb) to service_role;
