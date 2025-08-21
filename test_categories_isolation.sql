-- Script para testar o isolamento de categorias por organização
-- Execute este script no SQL Editor do Supabase Dashboard

-- =====================================================
-- TESTE DE ISOLAMENTO DE CATEGORIAS POR ORGANIZAÇÃO
-- =====================================================

-- 1. Verificar se RLS está habilitado na tabela categories
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'categories';

-- 2. Listar todas as políticas RLS da tabela categories
SELECT 
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_condition,
    with_check
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- 3. Verificar quantas categorias existem por organização
SELECT 
    organization_id,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_categories,
    COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenue_categories
FROM categories
GROUP BY organization_id
ORDER BY organization_id;

-- 4. Verificar se existem categorias com organization_id inválido
SELECT 
    c.id,
    c.name,
    c.organization_id,
    CASE 
        WHEN o.id IS NULL THEN 'ORGANIZAÇÃO NÃO EXISTE'
        ELSE 'OK'
    END as status
FROM categories c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE o.id IS NULL;

-- 5. Testar se um usuário pode ver apenas categorias da sua organização
-- (Este teste só funciona quando executado por um usuário autenticado)
SELECT 
    'Teste de acesso às categorias' as teste,
    COUNT(*) as categorias_visiveis
FROM categories;

-- 6. Verificar se as funções de debug estão funcionando
SELECT 
    'Usuário atual:' as info,
    auth.uid() as user_id;

-- 7. Verificar organizações do usuário atual
SELECT 
    'Organizações do usuário:' as info,
    uo.organization_id,
    o.name as organization_name,
    uo.role
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid();

-- 8. Verificar se as categorias retornadas pertencem às organizações do usuário
SELECT 
    'Categorias acessíveis:' as info,
    c.id,
    c.name,
    c.type,
    c.organization_id,
    o.name as organization_name
FROM categories c
JOIN organizations o ON o.id = c.organization_id
ORDER BY c.organization_id, c.name;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- 1. RLS deve estar habilitado (rls_enabled = true)
-- 2. Deve haver políticas para SELECT, INSERT, UPDATE, DELETE
-- 3. Cada organização deve ter suas próprias categorias
-- 4. Não deve haver categorias órfãs (sem organização válida)
-- 5. Usuário deve ver apenas categorias das suas organizações
-- =====================================================

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase Dashboard
-- 2. Faça login na aplicação primeiro para ter um usuário autenticado
-- 3. Verifique se os resultados mostram isolamento correto
-- 4. Se houver problemas, execute os scripts de correção RLS