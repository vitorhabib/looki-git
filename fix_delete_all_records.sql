-- =====================================================
-- CORREÇÃO COMPLETA PARA EXCLUSÃO DE REGISTROS
-- Corrige problemas de exclusão para: FATURAS, DESPESAS e registros relacionados
-- Execute este script COMPLETO no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. DIAGNÓSTICO INICIAL
SELECT 'DIAGNÓSTICO INICIAL - VERIFICANDO POLÍTICAS ATUAIS' as step;

-- Verificar políticas DELETE atuais para todas as tabelas
SELECT 
  'Políticas DELETE atuais:' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('invoices', 'expenses') 
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- Verificar constraints FK
SELECT 
  'Constraints FK atuais:' as info,
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('expenses')
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. CORREÇÃO PARA FATURAS (INVOICES)
SELECT 'CORRIGINDO POLÍTICAS DE EXCLUSÃO PARA FATURAS' as step;

-- Remover políticas DELETE problemáticas para invoices
DROP POLICY IF EXISTS "Users can delete own organization invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_fixed" ON invoices;

-- Criar política DELETE correta para invoices
CREATE POLICY "invoices_delete_final" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 3. CORREÇÃO PARA ITENS DE FATURA (INVOICE_ITEMS)
SELECT 'CORRIGINDO POLÍTICAS DE EXCLUSÃO PARA ITENS DE FATURA' as step;



-- 4. CORREÇÃO PARA DESPESAS (EXPENSES)
SELECT 'CORRIGINDO POLÍTICAS DE EXCLUSÃO PARA DESPESAS' as step;

-- Remover políticas DELETE problemáticas para expenses
DROP POLICY IF EXISTS "Users can delete own organization expenses" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;

-- Criar política DELETE correta para expenses
CREATE POLICY "expenses_delete_final" ON expenses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 5. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL - POLÍTICAS CRIADAS' as step;

-- Verificar políticas DELETE criadas
SELECT 
  'Políticas DELETE após correção:' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('invoices', 'expenses') 
  AND cmd = 'DELETE'
  AND policyname LIKE '%final'
ORDER BY tablename, policyname;



-- 6. FUNÇÃO DE TESTE PARA TODAS AS TABELAS
CREATE OR REPLACE FUNCTION test_delete_permissions_all()
RETURNS JSON AS $$
DECLARE
  result JSON;
  test_invoice_id UUID;
  test_expense_id UUID;
  can_delete_invoice BOOLEAN := false;
  can_delete_expense BOOLEAN := false;
  user_org_id UUID;
BEGIN
  -- Pegar organização do usuário
  SELECT organization_id INTO user_org_id
  FROM user_organizations 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Pegar uma fatura do usuário para teste
  SELECT id INTO test_invoice_id
  FROM invoices 
  WHERE organization_id = user_org_id
  LIMIT 1;
  
  -- Pegar uma despesa do usuário para teste
  SELECT id INTO test_expense_id
  FROM expenses 
  WHERE organization_id = user_org_id
  LIMIT 1;
  
  -- Testar se pode excluir fatura
  IF test_invoice_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM invoices 
      WHERE id = test_invoice_id
        AND organization_id IN (
          SELECT organization_id 
          FROM user_organizations 
          WHERE user_id = auth.uid()
        )
    ) INTO can_delete_invoice;
  END IF;
  
  -- Testar se pode excluir despesa
  IF test_expense_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM expenses 
      WHERE id = test_expense_id
        AND organization_id IN (
          SELECT organization_id 
          FROM user_organizations 
          WHERE user_id = auth.uid()
        )
    ) INTO can_delete_expense;
  END IF;
  
  SELECT json_build_object(
    'user_id', auth.uid(),
    'user_organization_id', user_org_id,
    'test_invoice_id', test_invoice_id,
    'test_expense_id', test_expense_id,
    'can_delete_invoice', can_delete_invoice,
    'can_delete_expense', can_delete_expense,
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar teste final
SELECT 'RESULTADO DO TESTE COMPLETO:' as info, test_delete_permissions_all() as test_result;

SELECT 'CORREÇÃO COMPLETA CONCLUÍDA - TESTE A EXCLUSÃO DE FATURAS E DESPESAS NA APLICAÇÃO' as final_message;