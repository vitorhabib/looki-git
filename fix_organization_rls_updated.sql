-- =====================================================
-- SCRIPT ATUALIZADO PARA CORRIGIR POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (sem IF EXISTS para garantir limpeza)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover todas as políticas da tabela organizations
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'organizations'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON organizations';
    END LOOP;
    
    -- Remover todas as políticas da tabela user_organizations
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_organizations'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON user_organizations';
    END LOOP;
END $$;

-- 3. Reabilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas para user_organizations
CREATE POLICY "user_orgs_select" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_orgs_insert" ON user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_orgs_update" ON user_organizations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_orgs_delete" ON user_organizations
  FOR DELETE USING (user_id = auth.uid());

-- 5. Criar políticas para organizations
CREATE POLICY "orgs_select" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "orgs_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orgs_update" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "orgs_delete" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
      AND uo.role = 'owner'
    )
  );

-- 6. Verificar políticas criadas
SELECT 
  tablename, 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('organizations', 'user_organizations')
ORDER BY tablename, policyname;

-- =====================================================
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- =====================================================