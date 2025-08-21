-- =====================================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS DA TABELA ORGANIZATIONS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Desabilitar RLS temporariamente para fazer as correções
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON user_organizations;
DROP POLICY IF EXISTS "Users can insert their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can update their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can delete their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can view own memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can insert own memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can update own memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can delete own memberships" ON user_organizations;

-- 3. Reabilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples e seguras para user_organizations
-- Usuários podem ver apenas seus próprios relacionamentos
CREATE POLICY "user_organizations_select_policy" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- Usuários podem inserir relacionamentos apenas para si mesmos
CREATE POLICY "user_organizations_insert_policy" ON user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar apenas seus próprios relacionamentos
CREATE POLICY "user_organizations_update_policy" ON user_organizations
  FOR UPDATE USING (user_id = auth.uid());

-- Usuários podem deletar apenas seus próprios relacionamentos
CREATE POLICY "user_organizations_delete_policy" ON user_organizations
  FOR DELETE USING (user_id = auth.uid());

-- 5. Criar políticas simples para organizations
-- Usuários podem ver organizações das quais fazem parte
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
    )
  );

-- Usuários autenticados podem criar organizações
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem atualizar organizações das quais fazem parte
CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
    )
  );

-- Usuários podem deletar organizações das quais fazem parte (opcional)
CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM user_organizations uo
      WHERE uo.organization_id = organizations.id 
      AND uo.user_id = auth.uid()
      AND uo.role = 'owner'
    )
  );

-- 6. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('organizations', 'user_organizations')
ORDER BY tablename, policyname;

-- =====================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- =====================================================

-- IMPORTANTE: 
-- 1. Execute este script no SQL Editor do Supabase Dashboard
-- 2. Após executar, teste o carregamento das organizações no frontend
-- 3. Verifique se não há mais erros de violação de política RLS