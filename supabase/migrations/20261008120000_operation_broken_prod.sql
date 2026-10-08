-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Operation: Broken Prod — 3-hour solo challenge (Bug Bounty → Arena exam → Forge → Ship It)
--
-- Every object is prefixed obp_ so nothing collides with the existing challenges.
-- Security model: RLS is ON for every obp_ table and there are NO policies, and all obp_ tables, views and
-- functions are revoked from anon/authenticated. Only the server (service role) touches them:
--   • the website      → TanStack server functions (src/lib/obp/*.functions.ts)
--   • the reporter     → /api/orbit/{register,report,status}          (participants' terminals)
--   • the verifier     → /api/orbit/organizer/*  (shared secret ORBIT_ORGANIZER_SECRET, organizer laptop)
-- Exam answers, hint texts and AI rubrics are NOT in this file (the repo is public): the host imports them
-- from Admin → Broken Prod → Content (obp-content-pack.json, generated on the organizer laptop).
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ───────────── settings (one row) ─────────────
create table if not exists public.obp_settings (
  id int primary key default 1 check (id = 1),
  event_title text not null default 'Operation: Broken Prod',
  current_stage int not null default 0,            -- 0 lobby · 1 Bug Bounty · 4 Arena · 2 Forge · 3 Ship It · 99 finished
  leaderboard_frozen boolean not null default false,
  frozen_snapshot jsonb,
  frozen_at timestamptz,
  event_code text not null default 'ORBIT-2026',
  registration_open boolean not null default true,
  download_url text,
  exam_open boolean not null default false,
  exam_minutes int not null default 30,
  exam_review_open boolean not null default false,
  exam_points_per_correct int not null default 3,
  exam_pass_scaled int not null default 720,
  updated_at timestamptz not null default now()
);
insert into public.obp_settings (id) values (1) on conflict do nothing;

-- ───────────── participants (solo: one row per person) ─────────────
create table if not exists public.obp_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text not null default '🚀',
  color text not null default '#7c5cff',
  join_code text not null unique,                    -- personal code: signs in on the website
  email text,
  token uuid not null default gen_random_uuid(),     -- reporter secret (in .orbit/ on the laptop)
  registered_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists obp_teams_email_key on public.obp_teams (lower(email));
create unique index if not exists obp_teams_token_key on public.obp_teams (token);

create table if not exists public.obp_stages (
  id int primary key,
  title text not null,
  subtitle text,
  status text not null default 'locked' check (status in ('locked','open','closed')),
  duration_minutes int not null,
  started_at timestamptz,
  ends_at timestamptz,
  position int not null default 0
);

create table if not exists public.obp_challenges (
  id text primary key,
  stage_id int not null references public.obp_stages(id),
  title text not null,
  description_md text not null,
  points_max int not null default 0,
  kind text not null check (kind in ('claim','single','judged','lightning','final','build','auto')),
  repeatable boolean not null default false,
  visible boolean not null default true,
  fields jsonb not null default '[]',
  sort_order int not null default 0
);

create table if not exists public.obp_challenge_rubrics (
  challenge_id text primary key references public.obp_challenges(id) on delete cascade,
  max int not null,
  auto_approve boolean not null default true,
  rubric_md text not null
);

create table if not exists public.obp_submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  challenge_id text not null references public.obp_challenges(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','partial','rejected')),
  points_awarded int not null default 0,
  reviewer_note text,
  ai_score int,
  ai_feedback jsonb,
  ai_scored_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists obp_submissions_team_idx on public.obp_submissions (team_id, created_at desc);

create table if not exists public.obp_adjustments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  points int not null,
  reason text not null,
  stage_id int references public.obp_stages(id),
  created_at timestamptz not null default now()
);

create table if not exists public.obp_hints (
  id text primary key,
  stage_id int not null references public.obp_stages(id),
  title text not null,
  cost int not null,
  body text not null
);

create table if not exists public.obp_hint_purchases (
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  hint_id text not null references public.obp_hints(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, hint_id)
);

create table if not exists public.obp_badges (
  id text primary key,
  emoji text not null,
  title text not null,
  description text not null
);

create table if not exists public.obp_team_badges (
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  badge_id text not null references public.obp_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (team_id, badge_id)
);

create table if not exists public.obp_announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'info' check (kind in ('info','twist','alert','win')),
  message_md text not null,
  created_at timestamptz not null default now()
);

-- ───────────── exam ─────────────
create table if not exists public.obp_exam_questions (
  id text primary key,
  domain text not null,
  domain_title text not null,
  kind text not null check (kind in ('single','multi')),
  prompt_md text not null,
  code text,
  options jsonb not null,
  correct jsonb not null,
  explanation_md text not null,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.obp_exam_attempts (
  team_id uuid primary key references public.obp_teams(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  submitted_at timestamptz,
  question_order jsonb not null,
  tab_switches int not null default 0,
  correct int,
  total int,
  scaled int,
  passed boolean,
  domain_results jsonb
);

create table if not exists public.obp_exam_answers (
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  question_id text not null references public.obp_exam_questions(id) on delete cascade,
  choice jsonb not null default '[]',
  flagged boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (team_id, question_id)
);

-- ───────────── hidden tests, First Blood, reporter ─────────────
create table if not exists public.obp_auto_scores (
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  stage_id int not null references public.obp_stages(id),
  total int not null,
  rows jsonb not null,
  commit_sha text,
  scored_at timestamptz not null default now(),
  primary key (team_id, stage_id)
);

create table if not exists public.obp_test_passes (
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  test_id text not null,
  first_passed_at timestamptz not null default now(),
  primary key (team_id, test_id)
);

create table if not exists public.obp_first_blood_tests (
  test_id text primary key,
  bonus int not null default 5,
  label text not null
);

create table if not exists public.obp_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.obp_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('auto','manual','bug')),
  note jsonb,
  local_summary jsonb,
  snapshot_path text,
  snapshot_sha256 text,
  snapshot_bytes int,
  status text not null default 'pending' check (status in ('pending','verifying','verified','superseded','error')),
  verified_at timestamptz,
  verified_stage int,
  verified_total int,
  verify_error text
);
create index if not exists obp_reports_pending_idx on public.obp_reports (status, created_at);
create index if not exists obp_reports_team_idx on public.obp_reports (team_id, created_at desc);

-- ───────────── views ─────────────
create or replace view public.obp_first_bloods as
select distinct on (fb.test_id)
  fb.test_id, fb.label, fb.bonus, t.id as team_id, t.name, t.emoji, t.color, tp.first_passed_at
from public.obp_first_blood_tests fb
join public.obp_test_passes tp on tp.test_id = fb.test_id
join public.obp_teams t on t.id = tp.team_id
order by fb.test_id, tp.first_passed_at, t.name;

create or replace view public.obp_leaderboard as
select
  t.id as team_id, t.name, t.emoji, t.color,
  (coalesce(s.pts, 0) + coalesce(a.pts, 0) - coalesce(h.cost, 0) + coalesce(e.pts, 0)
    + coalesce(au.pts, 0) + coalesce(fb.pts, 0))::bigint as score,
  coalesce(s.pts, 0)::bigint as challenge_points,
  coalesce(a.pts, 0)::bigint as adjustment_points,
  coalesce(h.cost, 0)::bigint as hint_cost,
  coalesce(s.approved, 0)::bigint as approved_count,
  coalesce(b.badges, '[]'::jsonb) as badges,
  greatest(s.last_at, a.last_at, e.last_at, au.last_at) as last_scored_at,
  coalesce(e.pts, 0)::bigint as exam_points,
  coalesce(au.pts, 0)::bigint as hidden_test_points,
  coalesce(fb.pts, 0)::bigint as first_blood_points
from public.obp_teams t
left join (
  select team_id, sum(points_awarded) pts, count(*) filter (where status in ('approved','partial')) approved, max(reviewed_at) last_at
  from public.obp_submissions where status in ('approved','partial') group by team_id
) s on s.team_id = t.id
left join (select team_id, sum(points) pts, max(created_at) last_at from public.obp_adjustments group by team_id) a on a.team_id = t.id
left join (
  select hp.team_id, sum(h.cost) cost from public.obp_hint_purchases hp join public.obp_hints h on h.id = hp.hint_id group by hp.team_id
) h on h.team_id = t.id
left join (
  select tb.team_id, jsonb_agg(jsonb_build_object('emoji', bd.emoji, 'title', bd.title) order by tb.awarded_at) badges
  from public.obp_team_badges tb join public.obp_badges bd on bd.id = tb.badge_id group by tb.team_id
) b on b.team_id = t.id
left join (
  select team_id, correct * (select exam_points_per_correct from public.obp_settings where id = 1) pts, submitted_at last_at
  from public.obp_exam_attempts where submitted_at is not null
) e on e.team_id = t.id
left join (select team_id, sum(total) pts, max(scored_at) last_at from public.obp_auto_scores group by team_id) au on au.team_id = t.id
left join (select team_id, sum(bonus) pts from public.obp_first_bloods group by team_id) fb on fb.team_id = t.id
where t.registered_at is not null or exists (select 1 from public.obp_submissions x where x.team_id = t.id);

create or replace view public.obp_exam_board as
select t.id as team_id, t.name, t.emoji, t.color, a.scaled, a.passed, a.correct, a.total, a.submitted_at,
       extract(epoch from (a.submitted_at - a.started_at))::int as seconds_used
from public.obp_exam_attempts a join public.obp_teams t on t.id = a.team_id
where a.submitted_at is not null;

create or replace view public.obp_exam_progress as
select t.id as team_id, t.name, t.emoji, a.started_at, a.ends_at, a.submitted_at,
       jsonb_array_length(a.question_order) as total,
       (select count(*) from public.obp_exam_answers x where x.team_id = t.id and jsonb_array_length(x.choice) > 0) as answered,
       (select count(*) from public.obp_exam_answers x where x.team_id = t.id and x.flagged) as flagged,
       a.tab_switches, a.scaled, a.passed
from public.obp_teams t left join public.obp_exam_attempts a on a.team_id = t.id
where t.registered_at is not null;

create or replace view public.obp_reports_feed as
select r.id, r.created_at, t.id as team_id, t.name, t.emoji, r.kind, r.note, r.local_summary, r.status,
       r.verified_stage, r.verified_total, r.verify_error, r.snapshot_bytes
from public.obp_reports r join public.obp_teams t on t.id = r.team_id;

-- ───────────── helpers ─────────────
create or replace function public.obp_team_id(p_code text)
returns uuid language sql stable security definer set search_path = public as
$$ select id from public.obp_teams where join_code = upper(btrim(coalesce(p_code, ''))) $$;

create or replace function public.obp_team_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = public as
$$ select jsonb_build_object('id', id, 'name', name, 'emoji', emoji, 'color', color, 'code', join_code)
   from public.obp_teams where join_code = upper(btrim(coalesce(p_code, ''))) $$;

-- ───────────── stages (host) ─────────────
-- Open one stage (closes any other open stage) and start its clock. p_stage 0 = lobby, 99 = event finished.
create or replace function public.obp_open_stage(p_stage int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.obp_stages set status = 'closed', ends_at = least(coalesce(ends_at, now()), now())
   where status = 'open' and id <> p_stage;
  if p_stage not in (0, 99) then
    if not exists (select 1 from public.obp_stages where id = p_stage) then raise exception 'Unknown stage %', p_stage; end if;
    update public.obp_stages set status = 'open', started_at = now(),
           ends_at = now() + make_interval(mins => duration_minutes)
     where id = p_stage;
  end if;
  update public.obp_settings set current_stage = p_stage, updated_at = now() where id = 1;
  -- keep the card in Admin → Challenges in sync
  update public.challenges set
    state = case when p_stage = 99 then 'finished' when p_stage = 0 then state else 'live' end,
    start_at = case when p_stage not in (0, 99) then coalesce(start_at, now()) else start_at end,
    end_at = case when p_stage = 99 then now()
                  when p_stage <> 0 and start_at is null then now() + make_interval(mins => duration_minutes)
                  else end_at end,
    paused_at = null
  where slug = 'broken-prod';
end $$;

create or replace function public.obp_extend_stage(p_stage int, p_minutes int)
returns void language sql security definer set search_path = public as $$
  update public.obp_stages set ends_at = coalesce(ends_at, now()) + make_interval(mins => p_minutes) where id = p_stage
$$;

-- Freeze captures the board as it is now; unfreeze (the reveal) shows the live board again.
create or replace function public.obp_set_frozen(p_frozen boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_frozen then
    update public.obp_settings set leaderboard_frozen = true, frozen_at = now(),
      frozen_snapshot = (select coalesce(jsonb_agg(to_jsonb(l) order by l.score desc, l.last_scored_at nulls last, l.name), '[]'::jsonb)
                         from public.obp_leaderboard l),
      updated_at = now()
    where id = 1;
  else
    update public.obp_settings set leaderboard_frozen = false, updated_at = now() where id = 1;
  end if;
end $$;

-- ───────────── submissions + hints ─────────────
create or replace function public.obp_submit_answer(p_code text, p_challenge text, p_payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_team uuid; v_ch public.obp_challenges; v_stage text; v_id uuid;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select * into v_ch from public.obp_challenges where id = p_challenge;
  if v_ch.id is null or not v_ch.visible then raise exception 'Challenge not available'; end if;
  if v_ch.kind = 'auto' then raise exception 'This one is automatic — just keep reporting your code'; end if;
  select status into v_stage from public.obp_stages where id = v_ch.stage_id;
  if v_stage is distinct from 'open' then raise exception 'This stage is not open'; end if;
  if jsonb_typeof(coalesce(p_payload, 'null'::jsonb)) <> 'object' then raise exception 'Invalid answer'; end if;
  if not v_ch.repeatable and exists (
    select 1 from public.obp_submissions where team_id = v_team and challenge_id = p_challenge and status in ('pending','approved','partial')
  ) then raise exception 'Already submitted — check the score and feedback on the card'; end if;
  insert into public.obp_submissions (team_id, challenge_id, payload) values (v_team, p_challenge, p_payload) returning id into v_id;
  return v_id;
end $$;

create or replace function public.obp_my_submissions(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id, 'challenge_id', s.challenge_id, 'payload', s.payload, 'status', s.status,
           'points_awarded', s.points_awarded, 'reviewer_note', s.reviewer_note, 'ai_score', s.ai_score,
           'breakdown', s.ai_feedback, 'created_at', s.created_at, 'reviewed_at', s.reviewed_at)
         order by s.created_at desc), '[]'::jsonb)
  from public.obp_submissions s where s.team_id = public.obp_team_id(p_code)
$$;

create or replace function public.obp_buy_hint(p_code text, p_hint text)
returns text language plpgsql security definer set search_path = public as $$
declare v_team uuid; v_body text; v_stage text;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select h.body, st.status into v_body, v_stage from public.obp_hints h join public.obp_stages st on st.id = h.stage_id where h.id = p_hint;
  if v_body is null then raise exception 'Unknown hint'; end if;
  if v_stage = 'locked' then raise exception 'This hint unlocks when its stage opens'; end if;
  insert into public.obp_hint_purchases (team_id, hint_id) values (v_team, p_hint) on conflict do nothing;
  return v_body;
end $$;

create or replace function public.obp_hint_shop(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', h.id, 'stage_id', h.stage_id, 'title', h.title, 'cost', h.cost,
           'bought', hp.hint_id is not null, 'body', case when hp.hint_id is not null then h.body end)
         order by h.stage_id, h.id), '[]'::jsonb)
  from public.obp_hints h
  left join public.obp_hint_purchases hp on hp.hint_id = h.id and hp.team_id = public.obp_team_id(p_code)
$$;

-- AI judge writes its verdict (server only)
create or replace function public.obp_record_ai_verdict(p_submission uuid, p_score int, p_feedback jsonb, p_note text, p_final boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_max int;
begin
  select coalesce(r.max, c.points_max) into v_max
  from public.obp_submissions s join public.obp_challenges c on c.id = s.challenge_id
  left join public.obp_challenge_rubrics r on r.challenge_id = s.challenge_id where s.id = p_submission;
  update public.obp_submissions set
    ai_score = p_score, ai_feedback = p_feedback, ai_scored_at = now(), reviewer_note = p_note,
    status = case when p_final then (case when p_score <= 0 then 'rejected' when p_score >= v_max then 'approved' else 'partial' end) else status end,
    points_awarded = case when p_final then greatest(p_score, 0) else points_awarded end,
    reviewed_at = case when p_final then now() else reviewed_at end
  where id = p_submission;
end $$;

-- Organizer scripts: judged score (F3 skill run, AI repo reviews). Re-running replaces the previous score.
create or replace function public.obp_publish_judged_score(p_team_code text, p_challenge text, p_points int, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare v_team uuid; v_sub uuid;
begin
  v_team := public.obp_team_id(p_team_code);
  if v_team is null then raise exception 'Unknown participant code %', p_team_code; end if;
  select id into v_sub from public.obp_submissions where team_id = v_team and challenge_id = p_challenge order by created_at desc limit 1;
  if v_sub is not null then
    update public.obp_submissions
       set status = case when p_points > 0 then 'approved' else 'rejected' end,
           points_awarded = greatest(p_points, 0), reviewer_note = p_note, ai_score = p_points, reviewed_at = now()
     where id = v_sub;
    return 'submission';
  end if;
  if exists (select 1 from public.obp_challenges where id = p_challenge) then
    insert into public.obp_submissions (team_id, challenge_id, payload, status, points_awarded, reviewer_note, ai_score, reviewed_at)
    values (v_team, p_challenge, '{}'::jsonb, case when p_points > 0 then 'approved' else 'rejected' end,
            greatest(p_points, 0), p_note, p_points, now());
    return 'created';
  end if;
  insert into public.obp_adjustments (team_id, points, reason) values (v_team, p_points, p_challenge || ': ' || p_note);
  return 'adjustment';
end $$;

-- ───────────── exam ─────────────
create or replace function public.obp_exam_grade(p_team uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_total int; v_correct int; s public.obp_settings; v_domains jsonb;
begin
  select * into s from public.obp_settings where id = 1;
  with ord as (
    select jsonb_array_elements_text(question_order) qid from public.obp_exam_attempts where team_id = p_team
  ), graded as (
    select q.id, q.domain, q.domain_title, q.sort_order,
           coalesce((select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(a.choice) x) c), '[]'::jsonb)
             = (select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(q.correct) x) c) as ok
    from ord join public.obp_exam_questions q on q.id = ord.qid
    left join public.obp_exam_answers a on a.team_id = p_team and a.question_id = q.id
  )
  select count(*), count(*) filter (where ok),
         (select jsonb_agg(jsonb_build_object(
                   'domain', domain, 'title', domain_title, 'correct', c, 'total', t,
                   'pct', round(100.0 * c / t), 'result', case when c * 100 >= 70 * t then 'Meets competencies' else 'Needs improvement' end)
                 order by min_sort)
            from (select domain, domain_title, count(*) filter (where ok) c, count(*) t, min(sort_order) min_sort
                  from graded group by domain, domain_title) d)
    into v_total, v_correct, v_domains
  from graded;

  update public.obp_exam_attempts set
    submitted_at = coalesce(submitted_at, least(now(), ends_at + interval '5 seconds')),
    total = v_total, correct = v_correct,
    scaled = case when v_total > 0 then 100 + round(900.0 * v_correct / v_total) else 100 end,
    passed = case when v_total > 0 then 100 + round(900.0 * v_correct / v_total) >= s.exam_pass_scaled else false end,
    domain_results = v_domains
  where team_id = p_team;
end $$;

create or replace function public.obp_exam_get(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; a public.obp_exam_attempts; s public.obp_settings; v_questions jsonb;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select * into s from public.obp_settings where id = 1;
  select * into a from public.obp_exam_attempts where team_id = v_team;
  if a.team_id is null then
    return jsonb_build_object('status', case when s.exam_open then 'ready' else 'closed' end,
                              'minutes', s.exam_minutes, 'pass_mark', s.exam_pass_scaled,
                              'total', (select count(*) from public.obp_exam_questions where active));
  end if;
  if a.submitted_at is null and now() > a.ends_at + interval '5 seconds' then
    perform public.obp_exam_grade(v_team);
    select * into a from public.obp_exam_attempts where team_id = v_team;
  end if;

  if a.submitted_at is not null then
    return jsonb_build_object(
      'status', 'submitted', 'submitted_at', a.submitted_at, 'started_at', a.started_at,
      'result', jsonb_build_object('scaled', a.scaled, 'passed', a.passed, 'pass_mark', s.exam_pass_scaled,
                                   'correct', a.correct, 'total', a.total, 'domains', a.domain_results,
                                   'points', a.correct * s.exam_points_per_correct),
      'review_open', s.exam_review_open);
  end if;

  select jsonb_agg(jsonb_build_object(
           'number', o.n, 'id', q.id, 'domain_title', q.domain_title, 'kind', q.kind,
           'select_count', jsonb_array_length(q.correct), 'prompt_md', q.prompt_md, 'code', q.code,
           'options', (select jsonb_agg(opt order by md5(a.team_id::text || q.id || (opt->>'id')))
                       from jsonb_array_elements(q.options) opt),
           'choice', coalesce(ans.choice, '[]'::jsonb), 'flagged', coalesce(ans.flagged, false))
         order by o.n)
    into v_questions
  from jsonb_array_elements_text(a.question_order) with ordinality as o(qid, n)
  join public.obp_exam_questions q on q.id = o.qid
  left join public.obp_exam_answers ans on ans.team_id = v_team and ans.question_id = q.id;

  return jsonb_build_object('status', 'in_progress', 'started_at', a.started_at, 'ends_at', a.ends_at,
                            'server_now', now(), 'total', jsonb_array_length(a.question_order), 'questions', v_questions);
end $$;

create or replace function public.obp_exam_start(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; s public.obp_settings; a public.obp_exam_attempts;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select * into a from public.obp_exam_attempts where team_id = v_team;
  if a.team_id is null then
    select * into s from public.obp_settings where id = 1;
    if not s.exam_open then raise exception 'The exam is not open yet'; end if;
    if not exists (select 1 from public.obp_exam_questions where active) then raise exception 'No exam questions loaded yet — tell the host'; end if;
    insert into public.obp_exam_attempts (team_id, ends_at, question_order)
    values (v_team, now() + make_interval(mins => s.exam_minutes),
            (select jsonb_agg(id order by random()) from public.obp_exam_questions where active))
    on conflict (team_id) do nothing;
  end if;
  return public.obp_exam_get(p_code);
end $$;

create or replace function public.obp_exam_save(p_code text, p_question text, p_choice jsonb, p_flagged boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_team uuid; a public.obp_exam_attempts;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select * into a from public.obp_exam_attempts where team_id = v_team;
  if a.team_id is null then raise exception 'Start the exam first'; end if;
  if a.submitted_at is not null then raise exception 'Exam already submitted'; end if;
  if now() > a.ends_at + interval '5 seconds' then raise exception 'Time is up'; end if;
  if not (a.question_order ? p_question) then raise exception 'Question not in your exam'; end if;
  if jsonb_typeof(coalesce(p_choice, '[]'::jsonb)) <> 'array' then raise exception 'Invalid answer'; end if;
  insert into public.obp_exam_answers (team_id, question_id, choice, flagged, updated_at)
  values (v_team, p_question, coalesce(p_choice, '[]'::jsonb), coalesce(p_flagged, false), now())
  on conflict (team_id, question_id) do update
    set choice = excluded.choice, flagged = excluded.flagged, updated_at = now();
  return 'saved';
end $$;

create or replace function public.obp_exam_submit(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; a public.obp_exam_attempts;
begin
  v_team := public.obp_team_id(p_code);
  if v_team is null then raise exception 'Unknown participant code'; end if;
  select * into a from public.obp_exam_attempts where team_id = v_team;
  if a.team_id is null then raise exception 'Start the exam first'; end if;
  if a.submitted_at is null then
    update public.obp_exam_attempts set submitted_at = least(now(), ends_at + interval '5 seconds') where team_id = v_team;
    perform public.obp_exam_grade(v_team);
  end if;
  return public.obp_exam_get(p_code);
end $$;

create or replace function public.obp_exam_blur(p_code text)
returns void language sql security definer set search_path = public as $$
  update public.obp_exam_attempts set tab_switches = tab_switches + 1
  where team_id = public.obp_team_id(p_code) and submitted_at is null
$$;

create or replace function public.obp_exam_review(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; a public.obp_exam_attempts;
begin
  if not (select exam_review_open from public.obp_settings where id = 1) then raise exception 'Answer review is not open yet'; end if;
  v_team := public.obp_team_id(p_code);
  select * into a from public.obp_exam_attempts where team_id = v_team;
  if a.team_id is null or a.submitted_at is null then raise exception 'Submit your exam first'; end if;
  return (select jsonb_agg(jsonb_build_object(
            'number', o.n, 'id', q.id, 'domain_title', q.domain_title, 'kind', q.kind, 'prompt_md', q.prompt_md,
            'code', q.code, 'options', q.options, 'correct', q.correct, 'explanation_md', q.explanation_md,
            'my_choice', coalesce(ans.choice, '[]'::jsonb),
            'is_correct', coalesce((select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(ans.choice) x) c), '[]'::jsonb)
                          = (select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(q.correct) x) c))
          order by o.n)
          from jsonb_array_elements_text(a.question_order) with ordinality as o(qid, n)
          join public.obp_exam_questions q on q.id = o.qid
          left join public.obp_exam_answers ans on ans.team_id = v_team and ans.question_id = q.id);
end $$;

create or replace function public.obp_exam_finalize_all(p_force boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select team_id from public.obp_exam_attempts
           where submitted_at is null and (p_force or now() > ends_at + interval '5 seconds') loop
    update public.obp_exam_attempts set submitted_at = least(now(), ends_at + interval '5 seconds') where team_id = r.team_id;
    perform public.obp_exam_grade(r.team_id);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.obp_exam_extend(p_team uuid, p_minutes int)
returns void language sql security definer set search_path = public as $$
  update public.obp_exam_attempts set ends_at = ends_at + make_interval(mins => p_minutes) where team_id = p_team and submitted_at is null
$$;

-- ───────────── registration + reporter ─────────────
create or replace function public.obp_register_participant(p_name text, p_email text, p_event_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.obp_settings; v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
        v_email text := lower(btrim(coalesce(p_email, ''))); t public.obp_teams; v_code text; i int := 0;
        emojis text[] := array['🚀','🛰️','🧭','🔥','⚡','🧠','🐙','🦊','🐼','🦉','🐉','🦄','🐝','🌵','🍀','🌊','⭐','🌙','☄️','🪐','🎯','🎲','🧩','🔮','🛸','🏎️','🦾','🤖','👾','🧪'];
        colors text[] := array['#7c5cff','#2bd99f','#ff5c7a','#ffb547','#3bb2ff','#ff7ae0','#9be15d','#ff8a3d','#00d1c1','#c9a7ff'];
begin
  select * into s from public.obp_settings where id = 1;
  if upper(btrim(coalesce(p_event_code, ''))) <> upper(s.event_code) then raise exception 'Wrong event code — check the projector'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 40 then raise exception 'Name must be 2–40 characters'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'That email does not look valid'; end if;

  select * into t from public.obp_teams where lower(email) = v_email;
  if t.id is not null then
    if lower(t.name) = lower(v_name) then
      update public.obp_teams set registered_at = coalesce(registered_at, now()) where id = t.id;
      return jsonb_build_object('code', t.join_code, 'token', t.token, 'name', t.name, 'existing', true);
    end if;
    raise exception 'This email is already registered with a different name';
  end if;
  if not s.registration_open then raise exception 'Registration is closed — ask the organizer'; end if;
  if exists (select 1 from public.obp_teams where lower(name) = lower(v_name)) then
    raise exception 'Someone already uses the name "%" — add your last name', v_name;
  end if;

  loop
    v_code := (select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
               from generate_series(1, 6));
    exit when not exists (select 1 from public.obp_teams where join_code = v_code);
    i := i + 1; if i > 20 then raise exception 'Could not allocate a code, try again'; end if;
  end loop;

  insert into public.obp_teams (name, emoji, color, join_code, email, registered_at)
  values (v_name, emojis[1 + floor(random() * array_length(emojis, 1))::int],
          colors[1 + floor(random() * array_length(colors, 1))::int], v_code, v_email, now())
  returning * into t;
  return jsonb_build_object('code', t.join_code, 'token', t.token, 'name', t.name, 'existing', false);
end $$;

create or replace function public.obp_team_by_token(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'name', name, 'code', join_code) from public.obp_teams where token = p_token
$$;

create or replace function public.obp_record_report(p_token uuid, p_kind text, p_note jsonb, p_local jsonb,
                                                    p_path text, p_sha text, p_bytes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_team uuid; v_id uuid; v_last timestamptz;
begin
  select id into v_team from public.obp_teams where token = p_token;
  if v_team is null then raise exception 'Unknown reporter token — run npm run register'; end if;
  perform pg_advisory_xact_lock(hashtext('obp_report_' || v_team::text));
  select max(created_at) into v_last from public.obp_reports where team_id = v_team and kind <> 'bug';
  if p_kind <> 'bug' and v_last is not null and now() - v_last < interval '15 seconds' then
    raise exception 'Slow down — one snapshot every 15 seconds';
  end if;
  if p_path is not null then
    update public.obp_reports set status = 'superseded' where team_id = v_team and status = 'pending';
  end if;
  insert into public.obp_reports (team_id, kind, note, local_summary, snapshot_path, snapshot_sha256, snapshot_bytes, status)
  values (v_team, p_kind, p_note, p_local, p_path, p_sha, p_bytes, case when p_path is null then 'verified' else 'pending' end)
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

-- Verifier: claim the oldest pending snapshots. A snapshot stuck in 'verifying' for 10 min is handed out again.
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
                                               'created_at', u.created_at) order by u.created_at), '[]'::jsonb)
    into v
  from upd u join public.obp_teams t on t.id = u.team_id;
  return v;
end $$;

create or replace function public.obp_publish_auto_score_team(p_team uuid, p_stage int, p_total int, p_rows jsonb, p_commit text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.obp_auto_scores (team_id, stage_id, total, rows, commit_sha, scored_at)
  values (p_team, p_stage, p_total, p_rows, p_commit, now())
  on conflict (team_id, stage_id) do update
    set total = excluded.total, rows = excluded.rows, commit_sha = excluded.commit_sha, scored_at = now();
  insert into public.obp_test_passes (team_id, test_id)
  select p_team, r->>'id' from jsonb_array_elements(p_rows) r where r->>'result' = 'PASS'
  on conflict do nothing;
end $$;

create or replace function public.obp_verify_report(p_report uuid, p_stage int, p_total int, p_rows jsonb, p_error text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.obp_reports;
begin
  select * into r from public.obp_reports where id = p_report;
  if r.id is null then raise exception 'Unknown report'; end if;
  update public.obp_reports set
    status = case when p_error is null then 'verified' else 'error' end,
    verified_at = now(), verified_stage = p_stage, verified_total = p_total, verify_error = p_error
  where id = p_report;
  if p_error is null and p_stage is not null then
    perform public.obp_publish_auto_score_team(r.team_id, p_stage, p_total, p_rows, left(coalesce(r.snapshot_sha256, ''), 7));
  end if;
end $$;

create or replace function public.obp_report_status(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select * from public.obp_teams where token = p_token)
  select jsonb_build_object(
    'name', (select name from me), 'code', (select join_code from me),
    'current_stage', (select current_stage from public.obp_settings where id = 1),
    'last_report', (select jsonb_build_object('at', created_at, 'kind', kind, 'status', status, 'error', verify_error)
                    from public.obp_reports where team_id = (select id from me) order by created_at desc limit 1),
    'pending', (select count(*) from public.obp_reports where team_id = (select id from me) and status in ('pending','verifying')),
    'bugs_reported', (select count(*) from public.obp_reports where team_id = (select id from me) and kind = 'bug'),
    'scores', coalesce((select jsonb_agg(jsonb_build_object('stage', stage_id, 'total', total, 'rows', rows, 'scored_at', scored_at) order by stage_id)
                        from public.obp_auto_scores where team_id = (select id from me)), '[]'::jsonb),
    'rank', case when (select leaderboard_frozen from public.obp_settings where id = 1) then null else
             (select rnk from (select team_id, rank() over (order by score desc) rnk from public.obp_leaderboard) l
              where l.team_id = (select id from me)) end)
  where exists (select 1 from me)
$$;

-- Everything the participant's page needs in one call
create or replace function public.obp_my_dashboard(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select * from public.obp_teams where join_code = upper(btrim(coalesce(p_code, ''))))
  select jsonb_build_object(
    'me', (select jsonb_build_object('id', id, 'name', name, 'emoji', emoji, 'color', color, 'code', join_code) from me),
    'auto_scores', coalesce((select jsonb_agg(jsonb_build_object('stage_id', stage_id, 'total', total, 'rows', rows,
                                                                 'commit_sha', commit_sha, 'scored_at', scored_at) order by stage_id)
                             from public.obp_auto_scores where team_id = (select id from me)), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(x order by x.created_at desc) from (
                          select created_at, kind, note, local_summary, status, verified_stage, verified_total, verify_error
                          from public.obp_reports where team_id = (select id from me) order by created_at desc limit 30) x), '[]'::jsonb),
    'submissions', public.obp_my_submissions(p_code),
    'hints', public.obp_hint_shop(p_code),
    'badges', coalesce((select jsonb_agg(jsonb_build_object('emoji', b.emoji, 'title', b.title)) from public.obp_team_badges tb
                        join public.obp_badges b on b.id = tb.badge_id where tb.team_id = (select id from me)), '[]'::jsonb),
    'score', (select score from public.obp_leaderboard where team_id = (select id from me)))
  where exists (select 1 from me)
$$;

-- ───────────── content pack import (host uploads obp-content-pack.json in the admin console) ─────────────
create or replace function public.obp_import_content(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_st int := 0; n_ch int := 0; n_ru int := 0; n_q int := 0; n_h int := 0; n_b int := 0; n_fb int := 0; n_del int := 0;
begin
  insert into public.obp_stages (id, title, subtitle, duration_minutes, position)
  select (x->>'id')::int, x->>'title', x->>'subtitle', (x->>'duration_minutes')::int, coalesce((x->>'position')::int, (x->>'id')::int * 10)
  from jsonb_array_elements(coalesce(p->'stages', '[]')) x
  on conflict (id) do update set title = excluded.title, subtitle = excluded.subtitle,
    duration_minutes = excluded.duration_minutes, position = excluded.position;
  get diagnostics n_st = row_count;

  insert into public.obp_challenges (id, stage_id, title, description_md, points_max, kind, repeatable, visible, fields, sort_order)
  select x->>'id', (x->>'stage_id')::int, x->>'title', x->>'description_md', (x->>'points_max')::int, x->>'kind',
         coalesce((x->>'repeatable')::boolean, false), coalesce((x->>'visible')::boolean, true),
         coalesce(x->'fields', '[]'), coalesce((x->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(p->'challenges', '[]')) x
  on conflict (id) do update set stage_id = excluded.stage_id, title = excluded.title, description_md = excluded.description_md,
    points_max = excluded.points_max, kind = excluded.kind, repeatable = excluded.repeatable, visible = excluded.visible,
    fields = excluded.fields, sort_order = excluded.sort_order;
  get diagnostics n_ch = row_count;

  if p ? 'challenges' then
    delete from public.obp_challenges c
     where not exists (select 1 from jsonb_array_elements(p->'challenges') x where x->>'id' = c.id)
       and not exists (select 1 from public.obp_submissions s where s.challenge_id = c.id);
    get diagnostics n_del = row_count;
  end if;

  insert into public.obp_challenge_rubrics (challenge_id, max, auto_approve, rubric_md)
  select x->>'challenge_id', (x->>'max')::int, coalesce((x->>'auto_approve')::boolean, true), x->>'rubric_md'
  from jsonb_array_elements(coalesce(p->'rubrics', '[]')) x
  where exists (select 1 from public.obp_challenges c where c.id = x->>'challenge_id')
  on conflict (challenge_id) do update set max = excluded.max, auto_approve = excluded.auto_approve, rubric_md = excluded.rubric_md;
  get diagnostics n_ru = row_count;

  insert into public.obp_exam_questions (id, domain, domain_title, kind, prompt_md, code, options, correct, explanation_md, active, sort_order)
  select x->>'id', x->>'domain', x->>'domain_title', x->>'kind', x->>'prompt_md', x->>'code', x->'options', x->'correct',
         coalesce(x->>'explanation_md', ''), coalesce((x->>'active')::boolean, true), coalesce((x->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(p->'questions', '[]')) x
  on conflict (id) do update set domain = excluded.domain, domain_title = excluded.domain_title, kind = excluded.kind,
    prompt_md = excluded.prompt_md, code = excluded.code, options = excluded.options, correct = excluded.correct,
    explanation_md = excluded.explanation_md, active = excluded.active, sort_order = excluded.sort_order;
  get diagnostics n_q = row_count;

  insert into public.obp_hints (id, stage_id, title, cost, body)
  select x->>'id', (x->>'stage_id')::int, x->>'title', (x->>'cost')::int, x->>'body'
  from jsonb_array_elements(coalesce(p->'hints', '[]')) x
  on conflict (id) do update set stage_id = excluded.stage_id, title = excluded.title, cost = excluded.cost, body = excluded.body;
  get diagnostics n_h = row_count;

  insert into public.obp_badges (id, emoji, title, description)
  select x->>'id', x->>'emoji', x->>'title', x->>'description'
  from jsonb_array_elements(coalesce(p->'badges', '[]')) x
  on conflict (id) do update set emoji = excluded.emoji, title = excluded.title, description = excluded.description;
  get diagnostics n_b = row_count;

  insert into public.obp_first_blood_tests (test_id, bonus, label)
  select x->>'test_id', coalesce((x->>'bonus')::int, 5), x->>'label'
  from jsonb_array_elements(coalesce(p->'first_blood_tests', '[]')) x
  on conflict (test_id) do update set bonus = excluded.bonus, label = excluded.label;
  get diagnostics n_fb = row_count;

  if p ? 'settings' then
    update public.obp_settings set
      exam_minutes = coalesce((p->'settings'->>'exam_minutes')::int, exam_minutes),
      exam_points_per_correct = coalesce((p->'settings'->>'exam_points_per_correct')::int, exam_points_per_correct),
      exam_pass_scaled = coalesce((p->'settings'->>'exam_pass_scaled')::int, exam_pass_scaled),
      updated_at = now()
    where id = 1;
  end if;

  return jsonb_build_object('stages', n_st, 'challenges', n_ch, 'removed_challenges', n_del, 'rubrics', n_ru,
                            'questions', n_q, 'hints', n_h, 'badges', n_b, 'first_blood_tests', n_fb);
end $$;

-- Wipe all participant data before the real event (keeps content + settings)
create or replace function public.obp_reset_event()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.obp_teams where true;          -- cascades to submissions, reports, exam, scores, hints, badges
  delete from public.obp_announcements where true;
  update public.obp_stages set status = 'locked', started_at = null, ends_at = null;
  update public.obp_settings set current_stage = 0, leaderboard_frozen = false, frozen_snapshot = null, frozen_at = null,
    exam_open = false, exam_review_open = false, registration_open = true, updated_at = now() where id = 1;
  update public.challenges set state = 'not_started', start_at = null, end_at = null, paused_at = null where slug = 'broken-prod';
end $$;

-- ───────────── storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obp-submissions', 'obp-submissions', false, 5242880, array['image/png','image/jpeg','image/gif','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obp-snapshots', 'obp-snapshots', false, 8388608, null)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obp-downloads', 'obp-downloads', true, 52428800, null)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

-- ───────────── the card in Admin → Challenges ─────────────
alter table public.challenges drop constraint if exists challenges_challenge_type_check;
alter table public.challenges add constraint challenges_challenge_type_check
  check (challenge_type in ('contribution', 'exam', 'orbit'));

insert into public.challenges (slug, title, description, goal, duration_minutes, state, repos, challenge_type)
values ('broken-prod', 'Challenge #3: Operation Broken Prod',
  'A 3-hour solo mission. Bug Bounty: fix 15 production bugs with your agents while hidden tests verify every snapshot live. The Arena: a 35-question certification-style exam plus a build sprint. The Forge: hooks, skills, agents and MCP, judged by AI. Ship It: a full feature end to end, with a plot twist.',
  'Fix production, pass the exam, build the tooling, ship the feature: highest score wins.',
  180, 'not_started', '[]'::jsonb, 'orbit')
on conflict (slug) do update set challenge_type = 'orbit';

-- ───────────── lock everything down: server (service role) only ─────────────
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
