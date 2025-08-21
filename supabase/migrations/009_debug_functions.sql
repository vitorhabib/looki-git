-- Função para testar auth.uid()
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Função para debug de associações de usuário
CREATE OR REPLACE FUNCTION debug_user_organizations()
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  organization_name TEXT,
  role TEXT,
  auth_uid UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    uo.user_id,
    uo.organization_id,
    o.name as organization_name,
    uo.role,
    auth.uid() as auth_uid
  FROM user_organizations uo
  JOIN organizations o ON o.id = uo.organization_id
  WHERE uo.user_id = auth.uid();
$$;