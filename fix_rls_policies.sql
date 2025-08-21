-- SCRIPT PARA CORRIGIR POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. CORRIGIR POLÍTICAS DA TABELA EXPENSES
-- Remover políticas incorretas
DROP POLICY IF EXISTS "Users can view own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own organization expenses" ON expenses;

-- Criar políticas corretas
CREATE POLICY "Users can view expenses from their organizations" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses for their organizations" ON expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses from their organizations" ON expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses from their organizations" ON expenses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 2. CORRIGIR POLÍTICAS DA TABELA CATEGORIES
-- Remover políticas incorretas
DROP POLICY IF EXISTS "Users can view categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can create categories for their organization" ON categories;
DROP POLICY IF EXISTS "Users can update categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can delete categories from their organization" ON categories;

-- Criar políticas corretas
CREATE POLICY "Users can view categories from their organizations" ON categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories for their organizations" ON categories
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories from their organizations" ON categories
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories from their organizations" ON categories
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 3. CRIAR FUNÇÕES DE DEBUG
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

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

-- 4. VERIFICAR SE AS POLÍTICAS FORAM APLICADAS CORRETAMENTE
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
WHERE tablename IN ('expenses', 'categories')
ORDER BY tablename, policyname;