ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS challenge_type text NOT NULL DEFAULT 'contribution'
CHECK (challenge_type IN ('contribution', 'exam'));

UPDATE public.challenges
SET challenge_type = 'exam'
WHERE slug = 'claude-architect';