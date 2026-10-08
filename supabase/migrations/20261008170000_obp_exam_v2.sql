-- Operation: Broken Prod — exam v2: "arrange in order" and "match" questions, plus question images (diagrams).
-- Idempotent. Run after 20261008120000_operation_broken_prod.sql.

alter table public.obp_exam_questions drop constraint if exists obp_exam_questions_kind_check;
alter table public.obp_exam_questions add constraint obp_exam_questions_kind_check check (kind in ('single','multi','order','match'));
alter table public.obp_exam_questions add column if not exists image text;   -- data: URL or https URL (diagram / screenshot)
alter table public.obp_exam_questions add column if not exists items jsonb;  -- match: left-hand items [{id, text}]

-- order: the exact sequence must match · everything else: the same set of answers (match answers are "item:option" pairs)
create or replace function public.obp_exam_is_correct(p_kind text, p_choice jsonb, p_correct jsonb)
returns boolean language sql immutable set search_path = public as $$
  select case when p_kind = 'order' then coalesce(p_choice, '[]'::jsonb) = p_correct
    else coalesce((select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(p_choice) x) c), '[]'::jsonb)
       = (select jsonb_agg(x order by x) from (select distinct jsonb_array_elements_text(p_correct) x) c) end
$$;

create or replace function public.obp_exam_grade(p_team uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_total int; v_correct int; s public.obp_settings; v_domains jsonb;
begin
  select * into s from public.obp_settings where id = 1;
  with ord as (
    select jsonb_array_elements_text(question_order) qid from public.obp_exam_attempts where team_id = p_team
  ), graded as (
    select q.id, q.domain, q.domain_title, q.sort_order,
           public.obp_exam_is_correct(q.kind, a.choice, q.correct) as ok
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
           'select_count', case when q.kind = 'match' then jsonb_array_length(coalesce(q.items, '[]')) else jsonb_array_length(q.correct) end,
           'prompt_md', q.prompt_md, 'code', q.code, 'image', q.image, 'items', q.items,
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
            'image', q.image, 'items', q.items,
            'is_correct', public.obp_exam_is_correct(q.kind, ans.choice, q.correct))
          order by o.n)
          from jsonb_array_elements_text(a.question_order) with ordinality as o(qid, n)
          join public.obp_exam_questions q on q.id = o.qid
          left join public.obp_exam_answers ans on ans.team_id = v_team and ans.question_id = q.id);
end $$;

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
