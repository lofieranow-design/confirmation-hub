
-- Delete submissions for non-admin agents
DELETE FROM customer_submissions WHERE agent_id IN (SELECT id FROM agents WHERE email != 'marouane@ecom.ma');

-- Delete user_roles for non-admin agents
DELETE FROM user_roles WHERE user_id IN (SELECT user_id FROM agents WHERE email != 'marouane@ecom.ma');

-- Delete non-admin agents
DELETE FROM agents WHERE email != 'marouane@ecom.ma';
