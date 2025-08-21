-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMA DE EXCLUSÃO DE FATURAS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Verificar políticas RLS atuais para DELETE na tabela invoices
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
WHERE tablename = 'invoices' AND cmd = 'DELETE';

-- 2. Remover política DELETE existente se houver problema
DROP POLICY IF EXISTS "Users can delete own organization invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

-- 3. Criar política DELETE corrigida para invoices
CREATE POLICY "invoices_delete_policy" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 4. Verificar se as políticas RLS estão funcionando corretamente
-- Teste com uma consulta simulada (substitua pelos IDs reais)
SELECT 
  'Teste de permissão DELETE' as test_name,
  auth.uid() as current_user,
  (
    SELECT COUNT(*) 
    FROM invoices 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  ) as invoices_user_can_access;

-- 8. Função para testar exclusão sem realmente excluir
CREATE OR REPLACE FUNCTION test_invoice_delete_permission(invoice_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  invoice_exists BOOLEAN;
  user_has_permission BOOLEAN;
  items_count INTEGER;
  org_id UUID;
BEGIN
  -- Verificar se a fatura existe e obter organization_id
  SELECT 
    EXISTS(SELECT 1 FROM invoices WHERE id = invoice_id_param),
    organization_id
  INTO invoice_exists, org_id
  FROM invoices 
  WHERE id = invoice_id_param;
  
  -- Verificar se o usuário tem permissão
  SELECT EXISTS(
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND organization_id = org_id
  ) INTO user_has_permission;
  
  -- Contar itens da fatura
  SELECT COUNT(*) FROM invoice_items 
  WHERE invoice_id = invoice_id_param INTO items_count;
  
  -- Retornar resultado do teste
  SELECT json_build_object(
    'invoice_exists', invoice_exists,
    'user_has_permission', user_has_permission,
    'items_count', items_count,
    'organization_id', org_id,
    'current_user_id', auth.uid(),
    'test_timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'invoices';

-- 7. Listar todas as políticas atuais para invoices
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'invoices'
ORDER BY cmd, policyname;

-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase Dashboard
-- 2. Verifique os resultados de cada consulta
-- 3. Teste a exclusão usando: SELECT test_invoice_delete_permission('INVOICE_ID'::UUID);
-- 4. Se tudo estiver correto, teste a exclusão na aplicação