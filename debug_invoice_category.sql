-- Script para verificar se as faturas têm categorias associadas
-- e se as políticas RLS estão funcionando corretamente

-- 1. Verificar faturas existentes e suas categorias
SELECT 
    i.id,
    i.title,
    i.category_id,
    i.organization_id,
    c.name as category_name,
    c.color as category_color,
    c.type as category_type
FROM invoices i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.organization_id = '247'
ORDER BY i.created_at DESC;

-- 2. Verificar se existem categorias para a organização 247
SELECT 
    id,
    name,
    type,
    color,
    organization_id
FROM categories 
WHERE organization_id = '247'
ORDER BY type, name;

-- 3. Verificar se há faturas sem category_id
SELECT 
    COUNT(*) as total_faturas,
    COUNT(category_id) as faturas_com_categoria,
    COUNT(*) - COUNT(category_id) as faturas_sem_categoria
FROM invoices 
WHERE organization_id = '247';

-- 4. Atualizar a fatura existente para ter uma categoria (se necessário)
-- Primeiro, vamos pegar uma categoria de receita disponível
SELECT id, name FROM categories 
WHERE organization_id = '247' AND type = 'revenue' 
LIMIT 1;

-- Se houver uma categoria disponível, você pode executar:
-- UPDATE invoices 
-- SET category_id = (SELECT id FROM categories WHERE organization_id = '247' AND type = 'revenue' LIMIT 1)
-- WHERE organization_id = '247' AND category_id IS NULL;

-- 5. Verificar políticas RLS para categories
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
WHERE tablename = 'categories';