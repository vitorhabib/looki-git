-- Script para verificar o estado atual das políticas RLS da tabela categories
-- Execute este script no SQL Editor do Supabase Dashboard

-- =====================================================
-- VERIFICAÇÃO DO ESTADO ATUAL DAS POLÍTICAS RLS
-- =====================================================

-- 1. Verificar se RLS está habilitado na tabela categories
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'categories';

-- 2. Listar todas as políticas RLS atuais da tabela categories
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

-- 3. Verificar quantas categorias cada usuário pode ver (teste de isolamento)
SELECT 
    'Usuário atual:' as info,
    auth.uid() as user_id;

-- 4. Verificar organizações do usuário atual
SELECT 
    'Organizações do usuário:' as info,
    uo.organization_id,
    o.name as organization_name,
    uo.role
FROM user_organizations uo
JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid();

-- 5. Verificar todas as categorias visíveis (deve mostrar apenas da organização do usuário)
SELECT 
    'Categorias visíveis:' as info,
    c.id,
    c.name,
    c.type,
    c.organization_id,
    o.name as organization_name
FROM categories c
JOIN organizations o ON o.id = c.organization_id
ORDER BY c.organization_id, c.name;

-- 6. Contar categorias por organização (para verificar se há vazamento de dados)
SELECT 
    'Total por organização:' as info,
    organization_id,
    COUNT(*) as total_categories
FROM categories
GROUP BY organization_id
ORDER BY organization_id;

-- =====================================================
-- DIAGNÓSTICO ESPERADO:
-- =====================================================
-- Se as políticas RLS estiverem funcionando corretamente:
-- - RLS deve estar habilitado (rls_enabled = true)
-- - Deve haver 4 políticas: SELECT, INSERT, UPDATE, DELETE
-- - Usuário deve ver apenas categorias da sua organização
-- - Contagem deve mostrar apenas categorias da organização do usuário
-- 
-- Se houver problema de isolamento:
-- - Usuário verá categorias de outras organizações
-- - Contagem mostrará categorias de múltiplas organizações
-- =====================================================