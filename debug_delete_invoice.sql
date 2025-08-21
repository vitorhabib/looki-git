-- Script para debugar problema de exclusão de faturas
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem faturas na tabela
SELECT 
  id,
  invoice_number,
  title,
  client_id,
  organization_id,
  status,
  total_amount,
  created_at
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Verificar políticas RLS para DELETE na tabela invoices
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

-- 3. Verificar se há restrições de chave estrangeira que impedem a exclusão
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name = 'invoices' OR tc.table_name = 'invoices');



-- 5. Testar exclusão de uma fatura específica (substitua 'INVOICE_ID' pelo ID real)
-- CUIDADO: Este comando irá excluir dados reais!
-- DELETE FROM invoices WHERE id = 'INVOICE_ID' AND organization_id = 'YOUR_ORG_ID';

-- 6. Verificar se o usuário atual tem permissões adequadas
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_user_email;

-- 7. Verificar organizações do usuário atual
SELECT 
  uo.user_id,
  uo.organization_id,
  uo.role,
  o.name as organization_name
FROM user_organizations uo
JOIN organizations o ON uo.organization_id = o.id
WHERE uo.user_id = auth.uid();

-- 8. Função de teste para simular exclusão (sem realmente excluir)
CREATE OR REPLACE FUNCTION test_invoice_deletion(invoice_id_param UUID, org_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  invoice_exists BOOLEAN;
  user_has_permission BOOLEAN;
  items_count INTEGER;
BEGIN
  -- Verificar se a fatura existe
  SELECT EXISTS(
    SELECT 1 FROM invoices 
    WHERE id = invoice_id_param AND organization_id = org_id_param
  ) INTO invoice_exists;
  
  -- Verificar se o usuário tem permissão
  SELECT EXISTS(
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND organization_id = org_id_param
  ) INTO user_has_permission;
  
  -- Definir items_count como 0 (removido invoice_items)
  items_count := 0;
  
  -- Retornar resultado do teste
  SELECT json_build_object(
    'invoice_exists', invoice_exists,
    'user_has_permission', user_has_permission,

    'current_user_id', auth.uid(),
    'test_timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de uso da função de teste:
-- SELECT test_invoice_deletion('INVOICE_ID'::UUID, 'ORG_ID'::UUID);