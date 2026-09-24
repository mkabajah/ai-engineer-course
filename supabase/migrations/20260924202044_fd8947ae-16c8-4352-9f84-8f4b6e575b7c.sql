CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  email text NOT NULL,
  edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  submitted_at timestamptz,
  mcq_points numeric,
  task_points numeric,
  total_score numeric,
  passed boolean,
  domain_scores jsonb,
  task_feedback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX exam_attempts_unique_email ON public.exam_attempts (challenge_id, lower(email));
GRANT SELECT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update attempts" ON public.exam_attempts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete attempts" ON public.exam_attempts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER exam_attempts_touch BEFORE UPDATE ON public.exam_attempts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.challenges (slug, title, description, goal, duration_minutes, state, repos)
VALUES ('claude-architect', 'Challenge #2: Claude Code Architect Exam Simulation',
 '75 questions across the five exam domains: agentic architecture, tools & MCP, Claude Code configuration, prompt engineering & structured output, and context management. 70 scenario questions plus 5 hands-on tasks reviewed by AI.',
 'Score 72 or higher out of 100 in 90 minutes.', 90, 'not_started', '[]'::jsonb)
ON CONFLICT DO NOTHING;