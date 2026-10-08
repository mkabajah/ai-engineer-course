-- Fix: Supabase rejects an UPDATE without a WHERE clause (pg_safeupdate), so "Reset event" failed.
create or replace function public.obp_reset_event()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.obp_teams where true;          -- cascades to submissions, reports, exam, scores, hints, badges
  delete from public.obp_announcements where true;
  update public.obp_stages set status = 'locked', started_at = null, ends_at = null where true;
  update public.obp_settings set current_stage = 0, leaderboard_frozen = false, frozen_snapshot = null, frozen_at = null,
    exam_open = false, exam_review_open = false, registration_open = true, updated_at = now() where id = 1;
  update public.challenges set state = 'not_started', start_at = null, end_at = null, paused_at = null where slug = 'broken-prod';
end $$;

revoke all on function public.obp_reset_event() from public, anon, authenticated;
grant execute on function public.obp_reset_event() to service_role;
