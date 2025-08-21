-- Script para diagnosticar problema de validação de categoria
-- Este script verifica se existem categorias para a organização atual

-- 1. Verificar se existem categorias para a organização
SELECT 
    id,
    name,
    type,
    color,
    organization_id,
    created_at
FROM categories 
WHERE organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6'
ORDER BY type, name;

-- 2. Contar categorias por tipo
SELECT 
    type,
    COUNT(*) as total
FROM categories 
WHERE organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6'
GROUP BY type;

-- 3. Verificar se há categorias de receita (revenue) disponíveis
SELECT 
    id,
    name,
    color
FROM categories 
WHERE organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6'
AND type = 'revenue'
ORDER BY name;

-- 4. Verificar faturas existentes e suas categorias
SELECT 
    i.id,
    i.title,
    i.category_id,
    c.name as category_name,
    c.type as category_type
FROM invoices i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6'
ORDER BY i.created_at DESC;

-- 5. Verificar se há problemas de RLS nas categorias
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'categories';

-- DIAGNÓSTICO:
-- Se não houver categorias, o erro é esperado quando se tenta selecionar uma categoria
-- Se houver categorias mas a validação falha, pode ser problema de RLS
-- Se a categoria_id da fatura não corresponder a nenhuma categoria da organização, o erro é válido