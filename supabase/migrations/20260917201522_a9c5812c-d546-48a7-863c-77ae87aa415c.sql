CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  goal text,
  repos jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes integer NOT NULL DEFAULT 45,
  start_at timestamptz,
  end_at timestamptz,
  paused_at timestamptz,
  state text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read challenges" ON public.challenges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  github_username text NOT NULL,
  link_url text NOT NULL,
  link_type text NOT NULL,
  repo_full_name text,
  edit_token uuid NOT NULL DEFAULT gen_random_uuid(),
  eval_status text NOT NULL DEFAULT 'awaiting',
  ai_review text,
  ai_score numeric,
  ai_confidence text,
  merge_state text,
  instructor_score numeric,
  instructor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX challenge_submissions_unique_link ON public.challenge_submissions (challenge_id, lower(link_url));
CREATE INDEX challenge_submissions_challenge_idx ON public.challenge_submissions (challenge_id);

GRANT ALL ON public.challenge_submissions TO service_role;
GRANT SELECT ON public.challenge_submissions TO authenticated;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read submissions" ON public.challenge_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER challenge_submissions_updated_at BEFORE UPDATE ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.challenges (slug, title, description, goal, duration_minutes, repos) VALUES (
  '1',
  'Challenge #1: First Open-Source Contribution',
  'Pick one approved repository, find a small but genuinely useful improvement, and open a public pull request (or push a public commit to your own fork). Quality beats size: a tiny, well-verified fix scores higher than a large, sloppy one. Submit the public PR or commit URL below before the timer ends. You can update your submission until the deadline.',
  'Make one useful open-source change in 45 minutes',
  45,
  '[{"name":"freeCodeCamp/freeCodeCamp","url":"https://github.com/freeCodeCamp/freeCodeCamp"},
    {"name":"public-apis/public-apis","url":"https://github.com/public-apis/public-apis"},
    {"name":"vercel/next.js","url":"https://github.com/vercel/next.js"},
    {"name":"supabase/supabase","url":"https://github.com/supabase/supabase"},
    {"name":"langchain-ai/langchain","url":"https://github.com/langchain-ai/langchain"},
    {"name":"modelcontextprotocol/servers","url":"https://github.com/modelcontextprotocol/servers"},
    {"name":"run-llama/llama_index","url":"https://github.com/run-llama/llama_index"},
    {"name":"chroma-core/chroma","url":"https://github.com/chroma-core/chroma"},
    {"name":"shadcn-ui/ui","url":"https://github.com/shadcn-ui/ui"},
    {"name":"TanStack/router","url":"https://github.com/TanStack/router"}]'::jsonb
);