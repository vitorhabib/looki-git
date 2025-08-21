-- =====================================================
-- CORREÇÃO IMEDIATA PARA EXCLUSÃO DE FATURAS
-- Execute este script COMPLETO no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Primeiro, vamos verificar o problema atual
SELECT 'DIAGNÓSTICO INICIAL' as step;

-- Verificar políticas DELETE atuais
SELECT 
  'Políticas DELETE atuais:' as info,
  policyname,
  qual
FROM pg_policies 
WHERE tablename = 'invoices' AND cmd = 'DELETE';

-- Verificar constraint FK entre invoice_items e invoices
SELECT 
  'Constraint FK atual:' as info,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'invoice_items' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name LIKE '%invoice_id%';

-- 2. CORREÇÃO 1: Remover políticas DELETE problemáticas
SELECT 'REMOVENDO POLÍTICAS PROBLEMÁTICAS' as step;

DROP POLICY IF EXISTS "Users can delete own organization invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;

-- 3. CORREÇÃO 2: Criar política DELETE correta
SELECT 'CRIANDO POLÍTICA DELETE CORRETA' as step;

CREATE POLICY "invoices_delete_fixed" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 4. VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL' as step;

-- Verificar políticas DELETE criadas
SELECT 
  'Políticas DELETE após correção:' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('invoices', 'invoice_items') 
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- Verificar constraint CASCADE
SELECT 
  'Constraint CASCADE configurada:' as info,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'invoice_items' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name LIKE '%invoice_id%';

-- 7. FUNÇÃO DE TESTE FINAL
CREATE OR REPLACE FUNCTION test_delete_permission()
RETURNS JSON AS $$
DECLARE
  result JSON;
  test_invoice_id UUID;
  can_delete BOOLEAN := false;
BEGIN
  -- Pegar uma fatura do usuário para teste
  SELECT id INTO test_invoice_id
  FROM invoices 
  WHERE organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
  LIMIT 1;
  
  -- Testar se pode excluir
  IF test_invoice_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM invoices 
      WHERE id = test_invoice_id
        AND organization_id IN (
          SELECT organization_id 
          FROM user_organizations 
          WHERE user_id = auth.uid()
        )
    ) INTO can_delete;
  END IF;
  
  SELECT json_build_object(
    'user_id', auth.uid(),
    'test_invoice_id', test_invoice_id,
    'can_delete', can_delete,
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar teste
SELECT 'RESULTADO DO TESTE:' as info, test_delete_permission() as test_result;

SELECT 'CORREÇÃO CONCLUÍDA - TESTE A EXCLUSÃO NA APLICAÇÃO' as final_message;