-- =====================================================
-- SCRIPT DE TESTE PARA EXCLUSÃO DE FATURAS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Listar faturas existentes para teste
SELECT 
  id,
  invoice_number,
  client_id,
  organization_id,
  status,
  created_at
FROM invoices 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar se o usuário atual tem permissão para ver faturas
SELECT 
  'Usuário atual:' as info,
  auth.uid() as user_id,
  auth.email() as user_email;

-- 3. Verificar organizações do usuário
SELECT 
  'Organizações do usuário:' as info,
  uo.organization_id,
  o.name as organization_name
FROM user_organizations uo
JOIN organizations o ON uo.organization_id = o.id
WHERE uo.user_id = auth.uid();

-- 4. Verificar políticas RLS para DELETE em invoices
SELECT 
  'Políticas DELETE para invoices:' as info,
  policyname,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'invoices' AND cmd = 'DELETE';

-- 5. Testar se uma fatura específica pode ser excluída (substitua o ID)
-- IMPORTANTE: Substitua 'INVOICE_ID_AQUI' pelo ID real de uma fatura
SELECT 
  'Teste de permissão para exclusão:' as info,
  i.id,
  i.invoice_number,
  i.organization_id,
  CASE 
    WHEN i.organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    ) THEN 'PERMITIDO'
    ELSE 'NEGADO'
  END as delete_permission
FROM invoices i
WHERE i.id = 'INVOICE_ID_AQUI'::UUID; -- Substitua pelo ID real





-- 8. Função para testar exclusão sem executar
CREATE OR REPLACE FUNCTION simulate_invoice_delete(invoice_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  invoice_record RECORD;
  user_orgs UUID[];
  items_count INTEGER;
  can_delete BOOLEAN := false;
  error_message TEXT := '';
BEGIN
  -- Obter organizações do usuário
  SELECT ARRAY_AGG(organization_id) INTO user_orgs
  FROM user_organizations 
  WHERE user_id = auth.uid();
  
  -- Verificar se a fatura existe e obter dados
  SELECT * INTO invoice_record
  FROM invoices 
  WHERE id = invoice_id_param;
  
  IF NOT FOUND THEN
    error_message := 'Fatura não encontrada';
  ELSIF invoice_record.organization_id = ANY(user_orgs) THEN
    can_delete := true;
  ELSE
    error_message := 'Usuário não tem permissão para excluir esta fatura';
  END IF;
  

  
  -- Montar resultado
  SELECT json_build_object(
    'invoice_id', invoice_id_param,
    'invoice_exists', FOUND,
    'user_id', auth.uid(),
    'user_organizations', user_orgs,
    'invoice_organization', invoice_record.organization_id,
    'can_delete', can_delete,
    'items_count', items_count,
    'error_message', error_message,
    'test_timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Exemplo de uso da função de teste
-- SELECT simulate_invoice_delete('INVOICE_ID_AQUI'::UUID);

-- 10. Verificar se RLS está habilitado
SELECT 
  'Status RLS:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('invoices', 'invoice_items')
ORDER BY tablename;

-- INSTRUÇÕES DE USO:
-- 1. Execute as consultas 1-4 e 10 primeiro para obter informações gerais
-- 2. Copie um ID de fatura da consulta 1
-- 3. Substitua 'INVOICE_ID_AQUI' pelo ID real nas consultas 5, 6 e no exemplo da consulta 9
-- 4. Execute a consulta 9 para testar a exclusão sem executar
-- 5. Verifique os resultados para identificar o problema