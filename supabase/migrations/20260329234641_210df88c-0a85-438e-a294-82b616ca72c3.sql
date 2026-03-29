CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if no agent exists for this user_id yet
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id = NEW.id) THEN
    INSERT INTO public.agents (user_id, name, email, suffix_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'suffix_code', UPPER(LEFT(split_part(NEW.email, '@', 1), 2)))
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agent');
  END IF;
  RETURN NEW;
END;
$function$;