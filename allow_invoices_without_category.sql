-- Script para permitir faturas sem categoria obrigatória
-- Este script verifica o estado atual e confirma que o sistema já suporta faturas sem categoria

-- 1. Verificar faturas existentes e suas categorias
SELECT 
    i.id,
    i.title,
    i.category_id,
    i.organization_id,
    c.name as category_name,
    CASE 
        WHEN i.category_id IS NULL THEN 'SEM CATEGORIA'
        ELSE 'COM CATEGORIA'
    END as status_categoria
FROM invoices i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6'
ORDER BY i.created_at DESC;

-- 2. Mostrar estatísticas de categorias
SELECT 
    COUNT(*) as total_faturas,
    COUNT(category_id) as faturas_com_categoria,
    COUNT(*) - COUNT(category_id) as faturas_sem_categoria,
    ROUND((COUNT(category_id) * 100.0 / COUNT(*)), 2) as percentual_com_categoria
FROM invoices 
WHERE organization_id = '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6';

-- 3. Verificar se a coluna category_id permite NULL (deve permitir)
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'category_id';

-- 4. Verificar constraint da foreign key (deve ser ON DELETE SET NULL)
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'invoices'
AND kcu.column_name = 'category_id';

-- RESULTADO ESPERADO:
-- ✅ A coluna category_id deve permitir NULL (is_nullable = 'YES')
-- ✅ A foreign key deve ter delete_rule = 'SET NULL'
-- ✅ O sistema já está configurado para funcionar sem categoria obrigatória
-- ✅ A interface já exibe "-" quando não há categoria

-- CONCLUSÃO:
-- Não é necessário criar categorias padrão!
-- O sistema já funciona perfeitamente com faturas sem categoria.
-- A fatura existente pode permanecer sem categoria_id e será exibida corretamente.