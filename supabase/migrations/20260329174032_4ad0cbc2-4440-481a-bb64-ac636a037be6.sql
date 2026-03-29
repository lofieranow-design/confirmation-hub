CREATE POLICY "Agents can delete own submissions"
ON public.customer_submissions
FOR DELETE
TO authenticated
USING (agent_id = get_agent_id_for_user(auth.uid()));