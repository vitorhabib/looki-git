-- Script para corrigir o isolamento de categorias por organização
-- Execute este script no SQL Editor do Supabase Dashboard

-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA CATEGORIAS
-- =====================================================

-- 1. Remover todas as políticas RLS existentes da tabela categories
DROP POLICY IF EXISTS "Users can view categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can create categories for their organization" ON categories;
DROP POLICY IF EXISTS "Users can update categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can delete categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can view categories from their organizations" ON categories;
DROP POLICY IF EXISTS "Users can insert categories for their organizations" ON categories;
DROP POLICY IF EXISTS "Users can update categories from their organizations" ON categories;
DROP POLICY IF EXISTS "Users can delete categories from their organizations" ON categories;
DROP POLICY IF EXISTS "Master admins can manage all categories" ON categories;

-- 2. Garantir que RLS está habilitado
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS corretas e seguras

-- Política SELECT: usuários podem ver apenas categorias das organizações às quais pertencem
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política INSERT: usuários podem criar categorias apenas para organizações às quais pertencem
CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política UPDATE: usuários podem atualizar apenas categorias das organizações às quais pertencem
CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política DELETE: usuários podem deletar apenas categorias das organizações às quais pertencem
CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICAÇÃO IMEDIATA
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    'RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'categories';

-- Listar políticas criadas
SELECT 
    'Políticas RLS:' as info,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- Testar isolamento: verificar categorias visíveis
SELECT 
    'Teste de isolamento:' as info,
    COUNT(*) as categorias_visiveis,
    COUNT(DISTINCT organization_id) as organizacoes_visiveis
FROM categories;

-- Verificar organizações do usuário atual
SELECT 
    'Organizações do usuário:' as info,
    uo.organization_id,
    o.name as organization_name
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid();

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- 1. RLS habilitado (rls_enabled = true)
-- 2. 4 políticas criadas (SELECT, INSERT, UPDATE, DELETE)
-- 3. Usuário deve ver apenas 1 organização nas categorias
-- 4. Número de categorias visíveis deve corresponder apenas à organização do usuário
-- =====================================================

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase Dashboard
-- 2. Verifique os resultados da verificação imediata
-- 3. Teste criando/editando uma categoria na aplicação
-- 4. Confirme que não consegue ver categorias de outras organizações