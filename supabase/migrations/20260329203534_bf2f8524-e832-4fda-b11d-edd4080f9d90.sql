
-- Add order_status column to customer_submissions
ALTER TABLE public.customer_submissions
ADD COLUMN order_status text DEFAULT NULL;

-- Add UPDATE RLS policy for agents to update their own submissions
CREATE POLICY "Agents can update own submissions"
ON public.customer_submissions
FOR UPDATE
TO authenticated
USING (agent_id = get_agent_id_for_user(auth.uid()))
WITH CHECK (agent_id = get_agent_id_for_user(auth.uid()));
