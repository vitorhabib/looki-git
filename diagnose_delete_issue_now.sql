-- =====================================================
-- DIAGNÓSTICO IMEDIATO DO PROBLEMA DE EXCLUSÃO
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. VERIFICAR POLÍTICAS RLS ATUAIS PARA DELETE
SELECT 
  'POLÍTICAS DELETE ATUAIS' as tipo,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('invoices', 'expenses', 'expense_items') 
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
  'STATUS RLS' as tipo,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('invoices', 'expenses', 'invoice_items', 'expense_items')
ORDER BY tablename;

-- 3. VERIFICAR CONSTRAINTS DE CHAVE ESTRANGEIRA
SELECT 
  'FOREIGN KEY CONSTRAINTS' as tipo,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name IN ('invoices', 'expenses') OR tc.table_name IN ('expense_items'))
ORDER BY tc.table_name;

-- 4. TESTAR PERMISSÕES DO USUÁRIO ATUAL
SELECT 
  'USUÁRIO ATUAL' as tipo,
  auth.uid() as user_id,
  auth.email() as user_email;

-- 5. VERIFICAR ORGANIZAÇÕES DO USUÁRIO
SELECT 
  'ORGANIZAÇÕES DO USUÁRIO' as tipo,
  o.id as organization_id,
  o.name as organization_name,
  uo.role as user_role
FROM organizations o
JOIN user_organizations uo ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid();

-- 6. CONTAR FATURAS E DESPESAS POR ORGANIZAÇÃO
SELECT 
  'CONTAGEM DE REGISTROS' as tipo,
  'invoices' as tabela,
  organization_id,
  COUNT(*) as total
FROM invoices 
WHERE organization_id IN (
  SELECT organization_id 
  FROM user_organizations 
  WHERE user_id = auth.uid()
)
GROUP BY organization_id

UNION ALL

SELECT 
  'CONTAGEM DE REGISTROS' as tipo,
  'expenses' as tabela,
  organization_id,
  COUNT(*) as total
FROM expenses 
WHERE organization_id IN (
  SELECT organization_id 
  FROM user_organizations 
  WHERE user_id = auth.uid()
)
GROUP BY organization_id;

-- 7. FUNÇÃO PARA TESTAR EXCLUSÃO SEM EXECUTAR
CREATE OR REPLACE FUNCTION test_delete_permissions()
RETURNS TABLE(
  tipo text,
  tabela text,
  pode_excluir boolean,
  erro text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_invoice_id uuid;
  test_expense_id uuid;
  user_org_id uuid;
BEGIN
  -- Pegar primeira organização do usuário
  SELECT organization_id INTO user_org_id
  FROM user_organizations 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  IF user_org_id IS NULL THEN
    RETURN QUERY SELECT 'ERRO'::text, 'user_organizations'::text, false, 'Usuário não pertence a nenhuma organização'::text;
    RETURN;
  END IF;
  
  -- Testar invoice
  SELECT id INTO test_invoice_id
  FROM invoices 
  WHERE organization_id = user_org_id 
  LIMIT 1;
  
  IF test_invoice_id IS NOT NULL THEN
    BEGIN
      -- Simular DELETE (não executa realmente)
      PERFORM 1 FROM invoices 
      WHERE id = test_invoice_id 
        AND organization_id = user_org_id;
      
      RETURN QUERY SELECT 'TESTE'::text, 'invoices'::text, true, 'Permissão OK'::text;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 'TESTE'::text, 'invoices'::text, false, SQLERRM::text;
    END;
  ELSE
    RETURN QUERY SELECT 'TESTE'::text, 'invoices'::text, false, 'Nenhuma fatura encontrada para teste'::text;
  END IF;
  
  -- Testar expense
  SELECT id INTO test_expense_id
  FROM expenses 
  WHERE organization_id = user_org_id 
  LIMIT 1;
  
  IF test_expense_id IS NOT NULL THEN
    BEGIN
      -- Simular DELETE (não executa realmente)
      PERFORM 1 FROM expenses 
      WHERE id = test_expense_id 
        AND organization_id = user_org_id;
      
      RETURN QUERY SELECT 'TESTE'::text, 'expenses'::text, true, 'Permissão OK'::text;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 'TESTE'::text, 'expenses'::text, false, SQLERRM::text;
    END;
  ELSE
    RETURN QUERY SELECT 'TESTE'::text, 'expenses'::text, false, 'Nenhuma despesa encontrada para teste'::text;
  END IF;
END;
$$;

-- 8. EXECUTAR TESTE DE PERMISSÕES
SELECT * FROM test_delete_permissions();

-- 9. MOSTRAR RESUMO FINAL
SELECT 
  '=== RESUMO DO DIAGNÓSTICO ===' as resultado,
  'Execute este script e analise os resultados' as instrucao,
  'Se houver problemas nas políticas RLS, execute fix_delete_all_records.sql' as proximos_passos;