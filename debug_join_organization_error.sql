-- Script para diagnosticar problemas ao ingressar em organizações
-- Execute este script no Supabase Dashboard para identificar o problema

-- 1. Verificar se RLS está habilitado na tabela user_organizations
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_organizations';

-- 2. Listar todas as políticas RLS da tabela user_organizations
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
WHERE tablename = 'user_organizations'
ORDER BY policyname;

-- 3. Verificar se existem organizações disponíveis
SELECT 
    id,
    name,
    created_by,
    created_at
FROM organizations 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar associações existentes na tabela user_organizations
SELECT 
    uo.id,
    uo.user_id,
    uo.organization_id,
    uo.role,
    o.name as organization_name,
    uo.created_at
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
ORDER BY uo.created_at DESC
LIMIT 10;

-- 5. Testar se o usuário atual consegue ver suas próprias associações
SELECT 
    'Teste de acesso às próprias associações' as teste,
    COUNT(*) as total_associacoes
FROM user_organizations
WHERE user_id = auth.uid();

-- 6. Verificar se há problemas com a função auth.uid()
SELECT 
    'Usuário atual' as info,
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'ERRO: auth.uid() retorna NULL'
        ELSE 'OK: Usuário autenticado'
    END as status;

-- 7. Testar inserção na tabela user_organizations (simulação)
-- ATENÇÃO: Este é apenas um teste de sintaxe, NÃO será executado
SELECT 
    'Teste de sintaxe para inserção' as teste,
    'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (auth.uid(), ''org_id'', ''member'')' as query_exemplo;

-- 8. Verificar se existem conflitos de unique constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_organizations' 
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 9. Verificar índices da tabela user_organizations
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_organizations';

-- 10. Verificar se há triggers na tabela user_organizations
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_organizations';

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase Dashboard
-- 2. Verifique se RLS está habilitado (deve ser true)
-- 3. Confirme se existem políticas RLS adequadas
-- 4. Verifique se auth.uid() retorna um ID válido
-- 5. Confirme se existem organizações disponíveis
-- 6. Relate os resultados para diagnóstico adicional