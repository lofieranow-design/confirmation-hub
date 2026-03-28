
CREATE OR REPLACE FUNCTION public.agent_exists(_agent_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents WHERE id = _agent_id
  )
$$;

DROP POLICY IF EXISTS "Public can insert submissions with valid agent" ON public.customer_submissions;

CREATE POLICY "Public can insert submissions with valid agent"
ON public.customer_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (agent_exists(agent_id));
