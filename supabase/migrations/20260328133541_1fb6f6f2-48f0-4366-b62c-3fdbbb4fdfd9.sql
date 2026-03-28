
-- Admins can view all agents
CREATE POLICY "Admins can view all agents" ON public.agents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any agent
CREATE POLICY "Admins can update all agents" ON public.agents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete agents
CREATE POLICY "Admins can delete agents" ON public.agents
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert agents
CREATE POLICY "Admins can insert agents" ON public.agents
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON public.customer_submissions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
