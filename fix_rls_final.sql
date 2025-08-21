-- =====================================================
-- SCRIPT FINAL PARA CORRIGIR RLS DE ORGANIZAÇÕES
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON user_organizations;

-- 3. Reabilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas corrigidas para user_organizations
CREATE POLICY "user_orgs_select" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_orgs_insert" ON user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_orgs_update" ON user_organizations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_orgs_delete" ON user_organizations
  FOR DELETE USING (user_id = auth.uid());

-- 5. Criar políticas corrigidas para organizations
-- Permitir que usuários autenticados criem organizações (sem verificação circular)
CREATE POLICY "orgs_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem ver organizações das quais fazem parte
CREATE POLICY "orgs_select" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
    )
  );

-- Usuários podem atualizar organizações das quais fazem parte
CREATE POLICY "orgs_update" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
      AND uo.role IN ('owner', 'admin')
    )
  );

-- Apenas owners podem deletar organizações
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
-- TESTE: Após executar, teste criando uma organização
-- =====================================================