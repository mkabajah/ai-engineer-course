
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to first signup
CREATE OR REPLACE FUNCTION public.handle_new_user_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_first_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_first_admin();

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- identity
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  location_pref TEXT,
  -- education / work
  education_degree TEXT,
  education_institution TEXT,
  graduation_year INT,
  employment_status TEXT,
  employment_role TEXT,
  english_level INT,
  english_sample TEXT,
  time_commitment_ok BOOLEAN DEFAULT false,
  time_commitment_note TEXT,
  financial_ack BOOLEAN DEFAULT false,
  -- portfolio
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  languages TEXT,
  llm_experience BOOLEAN DEFAULT false,
  llm_experience_desc TEXT,
  -- essays
  essay_shipping TEXT,
  essay_curiosity TEXT,
  essay_fit TEXT,
  -- video
  video_path TEXT,
  -- quiz aggregates
  quiz_correct_count INT DEFAULT 0,
  quiz_total_count INT DEFAULT 0,
  quiz_avg_time_seconds NUMERIC,
  quiz_completed_at TIMESTAMPTZ,
  -- review state
  stage TEXT NOT NULL DEFAULT 'applied', -- applied, takehome, interview, admitted, rejected
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewing, shortlisted, rejected
  total_score NUMERIC,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.applications (created_at DESC);
CREATE INDEX ON public.applications (stage);
CREATE INDEX ON public.applications (total_score DESC NULLS LAST);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit application" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read applications" ON public.applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update applications" ON public.applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete applications" ON public.applications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Allow anon to update their own row briefly after insert (for video_path + quiz)
-- We use a server function with admin client instead; no anon update policy.

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  choices JSONB NOT NULL, -- array of strings
  correct_index INT NOT NULL,
  time_limit_seconds INT NOT NULL DEFAULT 30,
  order_index INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read active questions" ON public.quiz_questions
  FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage questions" ON public.quiz_questions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Quiz responses
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_index INT,
  time_taken_seconds NUMERIC,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.quiz_responses (application_id);
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert quiz response" ON public.quiz_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read quiz responses" ON public.quiz_responses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AI scores
CREATE TABLE public.ai_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL, -- shipping, curiosity, fit, communication, portfolio, overall
  score NUMERIC NOT NULL,
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_scores (application_id);
ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read ai scores" ON public.ai_scores
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Inserts/deletes go through service-role server function.

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('applicant-videos', 'applicant-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to videos bucket (candidates submit without auth)
CREATE POLICY "anyone upload videos" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'applicant-videos');
CREATE POLICY "admins read videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'applicant-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'applicant-videos' AND public.has_role(auth.uid(), 'admin'));

-- Seed quiz questions
INSERT INTO public.quiz_questions (question, choices, correct_index, time_limit_seconds, order_index) VALUES
  ('In Python, which of these correctly creates a virtual environment using the standard library?',
   '["pip install venv", "python -m venv .venv", "virtualenv create", "python venv --new"]'::jsonb, 1, 25, 1),
  ('When calling an LLM API, what does ''temperature=0'' typically mean?',
   '["The model returns empty output", "The model uses the cheapest tier", "Output is deterministic / least random", "The model rejects the request"]'::jsonb, 2, 25, 2),
  ('Which HTTP status code indicates a resource was not found?',
   '["200", "301", "404", "500"]'::jsonb, 2, 20, 3),
  ('What is the main purpose of a vector database in a RAG (Retrieval Augmented Generation) system?',
   '["Compress the LLM weights", "Store and search documents by semantic similarity", "Cache HTTP requests", "Replace the LLM entirely"]'::jsonb, 1, 35, 4);
