CREATE TABLE public.exam_questions (
  id text PRIMARY KEY,
  exam_slug text NOT NULL REFERENCES public.challenges(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('single','multi','ordering','task')),
  domain text NOT NULL CHECK (domain IN ('agentic','tools_mcp','claude_code','prompting','context')),
  prompt text NOT NULL,
  choices jsonb,
  correct_answer jsonb,
  scenario text,
  rubric text,
  explanation text NOT NULL DEFAULT '',
  points numeric NOT NULL DEFAULT 1 CHECK (points > 0 AND points <= 100),
  presentation text,
  exhibit text,
  starter text,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_questions_shape CHECK (
    (kind = 'task' AND scenario IS NOT NULL AND rubric IS NOT NULL AND correct_answer IS NULL)
    OR (kind = 'single' AND jsonb_typeof(choices) = 'array' AND jsonb_typeof(correct_answer) = 'number')
    OR (kind IN ('multi','ordering') AND jsonb_typeof(choices) = 'array' AND jsonb_typeof(correct_answer) = 'array')
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage exam questions" ON public.exam_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER exam_questions_touch BEFORE UPDATE ON public.exam_questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX exam_questions_exam_order_idx ON public.exam_questions(exam_slug, order_index);