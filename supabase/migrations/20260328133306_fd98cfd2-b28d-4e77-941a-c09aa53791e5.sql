
-- Drop the overly permissive policy and replace with one that requires agent_id to be valid
DROP POLICY "Anyone can insert submissions" ON public.customer_submissions;

CREATE POLICY "Public can insert submissions with valid agent" ON public.customer_submissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id)
  );
