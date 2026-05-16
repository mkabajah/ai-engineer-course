
-- Pin search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Revoke direct execute on internal security-definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user_first_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role still needs to be callable by authenticated users (used inside RLS policies the user owns)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
