-- Create the admin user via a one-time function
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'marouane@ecom.ma';
  
  IF new_user_id IS NULL THEN
    -- We'll need to create via edge function instead since we can't create auth users in migrations
    -- For now, just ensure the role setup is ready
    RAISE NOTICE 'Admin user needs to be created via signup';
  ELSE
    -- Ensure admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;