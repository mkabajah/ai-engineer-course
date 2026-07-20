-- Reset admin password and lock down auto-admin creation
UPDATE auth.users
SET encrypted_password = crypt('q1w2e3r4Root!', gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = 'kabajah.mohammad@gmail.com';

-- Ensure the admin role is granted
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'kabajah.mohammad@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove first-signup-becomes-admin helper (no longer wanted)
DROP FUNCTION IF EXISTS public.handle_new_user_first_admin() CASCADE;