-- =====================================================
-- DIAGNÓSTICO COMPLETO DE EXCLUSÃO DE DESPESAS
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA EXPENSES
SELECT 'ESTRUTURA DA TABELA EXPENSES' as step;

\d expenses;

-- 2. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT 'POLÍTICAS RLS PARA EXPENSES' as step;

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
WHERE tablename = 'expenses'
ORDER BY policyname;

-- 3. VERIFICAR STATUS DO RLS
SELECT 'STATUS DO RLS' as step;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'expenses';

-- 4. LISTAR DESPESAS EXISTENTES
SELECT 'DESPESAS EXISTENTES' as step;

SELECT 
  id,
  title,
  organization_id,
  created_at,
  updated_at
FROM expenses 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. VERIFICAR USUÁRIO ATUAL E ORGANIZAÇÕES
SELECT 'USUÁRIO ATUAL E ORGANIZAÇÕES' as step;

SELECT 
  'Usuário atual:' as info,
  auth.uid() as user_id;

SELECT 
  'Organizações do usuário:' as info,
  uo.organization_id,
  o.name as organization_name
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid();

-- 6. TESTE DE EXCLUSÃO SIMULADA (SEM EXECUTAR)
SELECT 'TESTE DE EXCLUSÃO SIMULADA' as step;

-- Verificar quais despesas o usuário atual pode ver
SELECT 
  'Despesas visíveis para o usuário atual:' as info,
  COUNT(*) as total_visible
FROM expenses 
WHERE organization_id IN (
  SELECT organization_id 
  FROM user_organizations 
  WHERE user_id = auth.uid()
);

-- 7. VERIFICAR CONSTRAINTS E FOREIGN KEYS
SELECT 'CONSTRAINTS DA TABELA EXPENSES' as step;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'expenses'::regclass;

-- 8. VERIFICAR TRIGGERS
SELECT 'TRIGGERS DA TABELA EXPENSES' as step;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'expenses';

-- 9. TESTE DE EXCLUSÃO REAL (CUIDADO!)
-- DESCOMENTE APENAS SE QUISER TESTAR COM UMA DESPESA ESPECÍFICA
/*
SELECT 'EXECUTANDO TESTE DE EXCLUSÃO REAL' as step;

-- Primeiro, criar uma despesa de teste
INSERT INTO expenses (
  title,
  description,
  amount,
  expense_date,
  payment_method,
  status,
  organization_id
) VALUES (
  'TESTE DE EXCLUSÃO',
  'Despesa criada apenas para testar exclusão',
  10.00,
  CURRENT_DATE,
  'cash',
  'pending',
  (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
) RETURNING id, title;

-- Tentar excluir a despesa de teste
DELETE FROM expenses 
WHERE title = 'TESTE DE EXCLUSÃO' 
  AND organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
RETURNING id, title;
*/

-- 10. VERIFICAR LOGS DE ERRO (se disponível)
SELECT 'VERIFICAÇÃO FINAL' as step;

SELECT 
  'Diagnóstico concluído. Verifique os resultados acima.' as resultado,
  'Se RLS estiver ativo, as políticas podem estar bloqueando a exclusão.' as dica1,
  'Se RLS estiver desativo, pode ser um problema de constraint ou trigger.' as dica2;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase Dashboard
-- 2. Analise cada seção dos resultados
-- 3. Se necessário, descomente a seção de teste real
-- 4. Verifique os logs do console do navegador também
-- =====================================================