DROP POLICY IF EXISTS "anyone read active questions" ON public.quiz_questions;

CREATE POLICY "anon read active questions" ON public.quiz_questions
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "authenticated read questions" ON public.quiz_questions
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));