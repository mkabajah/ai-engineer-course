-- Operation: Broken Prod — admin views: each participant's exam answers, question statistics, announcement templates.
-- Idempotent. Run after 20261008170000_obp_exam_v2.sql.

alter table public.obp_settings add column if not exists announcement_templates jsonb not null default '[]';

-- One participant's exam, question by question, with their answer and the correct one (host only, any time)
create or replace function public.obp_admin_exam_detail(p_team uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'attempt', (select jsonb_build_object('started_at', a.started_at, 'ends_at', a.ends_at, 'submitted_at', a.submitted_at,
                                          'tab_switches', a.tab_switches, 'correct', a.correct, 'total', a.total, 'scaled', a.scaled,
                                          'passed', a.passed, 'domains', a.domain_results)
                from public.obp_exam_attempts a where a.team_id = p_team),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'number', o.n, 'id', q.id, 'domain_title', q.domain_title, 'kind', q.kind, 'prompt_md', q.prompt_md,
               'code', q.code, 'image', q.image, 'items', q.items, 'options', q.options, 'correct', q.correct,
               'explanation_md', q.explanation_md, 'my_choice', coalesce(ans.choice, '[]'::jsonb),
               'flagged', coalesce(ans.flagged, false), 'answered_at', ans.updated_at,
               'is_correct', public.obp_exam_is_correct(q.kind, ans.choice, q.correct))
             order by o.n)
      from public.obp_exam_attempts a
      cross join lateral jsonb_array_elements_text(a.question_order) with ordinality as o(qid, n)
      join public.obp_exam_questions q on q.id = o.qid
      left join public.obp_exam_answers ans on ans.team_id = a.team_id and ans.question_id = q.id
      where a.team_id = p_team), '[]'::jsonb))
$$;

-- Question bank with live statistics (host only)
create or replace function public.obp_admin_question_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', q.id, 'domain_title', q.domain_title, 'kind', q.kind, 'active', q.active, 'prompt_md', q.prompt_md,
           'code', q.code, 'image', q.image, 'items', q.items, 'options', q.options, 'correct', q.correct,
           'explanation_md', q.explanation_md,
           'seen', (select count(*) from public.obp_exam_attempts a where a.question_order ? q.id),
           'answered', (select count(*) from public.obp_exam_answers x where x.question_id = q.id and jsonb_array_length(x.choice) > 0),
           'right', (select count(*) from public.obp_exam_answers x where x.question_id = q.id and public.obp_exam_is_correct(q.kind, x.choice, q.correct)),
           'picks', (select coalesce(jsonb_object_agg(v, c), '{}'::jsonb) from (
                       select v, count(*) c from public.obp_exam_answers x, jsonb_array_elements_text(x.choice) v
                       where x.question_id = q.id group by v) t))
         order by q.active desc, q.sort_order), '[]'::jsonb)
  from public.obp_exam_questions q
$$;

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

  insert into public.obp_exam_questions (id, domain, domain_title, kind, prompt_md, code, options, correct, explanation_md, active, sort_order, image, items)
  select x->>'id', x->>'domain', x->>'domain_title', x->>'kind', x->>'prompt_md', x->>'code', x->'options', x->'correct',
         coalesce(x->>'explanation_md', ''), coalesce((x->>'active')::boolean, true), coalesce((x->>'sort_order')::int, 0),
         x->>'image', x->'items'
  from jsonb_array_elements(coalesce(p->'questions', '[]')) x
  on conflict (id) do update set domain = excluded.domain, domain_title = excluded.domain_title, kind = excluded.kind,
    prompt_md = excluded.prompt_md, code = excluded.code, options = excluded.options, correct = excluded.correct,
    explanation_md = excluded.explanation_md, active = excluded.active, sort_order = excluded.sort_order,
    image = excluded.image, items = excluded.items;
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

  if p ? 'announcement_templates' then
    update public.obp_settings set announcement_templates = p->'announcement_templates', updated_at = now() where id = 1;
  end if;

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


-- same lock-down as the first migration
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'obp\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
