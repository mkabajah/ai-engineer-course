-- The verifier needs each participant's number of real bug reports (Stage 1: a fix scores only once it is reported).
-- A report counts when it has a title (8+ chars) and a root cause (15+ chars); duplicate titles count once.
create or replace function public.obp_claim_pending_reports(p_limit int default 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  update public.obp_reports set status = 'pending'
   where status = 'verifying' and coalesce(verified_at, created_at) < now() - interval '10 minutes';
  with picked as (
    select r.id from public.obp_reports r
    where r.status = 'pending' and r.snapshot_path is not null
    order by r.created_at
    limit greatest(1, least(p_limit, 100))
    for update skip locked
  ), upd as (
    update public.obp_reports r set status = 'verifying', verified_at = now()
    from picked where r.id = picked.id
    returning r.id, r.team_id, r.snapshot_path, r.snapshot_sha256, r.created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'team_id', u.team_id, 'team_name', t.name, 'team_code', t.join_code,
                                               'snapshot_path', u.snapshot_path, 'snapshot_sha256', u.snapshot_sha256,
                                               'created_at', u.created_at,
                                               'bug_reports', (select count(distinct lower(trim(b.note->>'title')))
                                                                 from public.obp_reports b
                                                                where b.team_id = u.team_id and b.kind = 'bug'
                                                                  and length(trim(coalesce(b.note->>'title', ''))) >= 8
                                                                  and length(trim(coalesce(b.note->>'root_cause', ''))) >= 15))
                            order by u.created_at), '[]'::jsonb)
    into v
  from upd u join public.obp_teams t on t.id = u.team_id;
  return v;
end $$;

revoke all on function public.obp_claim_pending_reports(int) from public, anon, authenticated;
grant execute on function public.obp_claim_pending_reports(int) to service_role;
