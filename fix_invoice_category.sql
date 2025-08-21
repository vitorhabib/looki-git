-- Script para corrigir a categoria da fatura existente
-- Este script atualiza faturas sem categoria para usar uma categoria padrão

-- 1. Primeiro, verificar se existem categorias de receita para a organização 247
DO $$
DECLARE
    revenue_category_id UUID;
    invoice_count INTEGER;
BEGIN
    -- Buscar uma categoria de receita para a organização 247
    SELECT id INTO revenue_category_id 
    FROM categories 
    WHERE organization_id = '247' AND type = 'revenue' 
    LIMIT 1;
    
    IF revenue_category_id IS NOT NULL THEN
        -- Contar quantas faturas não têm categoria
        SELECT COUNT(*) INTO invoice_count
        FROM invoices 
        WHERE organization_id = '247' AND category_id IS NULL;
        
        RAISE NOTICE 'Encontrada categoria de receita: %', revenue_category_id;
        RAISE NOTICE 'Faturas sem categoria: %', invoice_count;
        
        -- Atualizar faturas sem categoria
        UPDATE invoices 
        SET category_id = revenue_category_id,
            updated_at = NOW()
        WHERE organization_id = '247' AND category_id IS NULL;
        
        RAISE NOTICE 'Faturas atualizadas com categoria: %', invoice_count;
    ELSE
        RAISE NOTICE 'Nenhuma categoria de receita encontrada para a organização 247';
        RAISE NOTICE 'Execute primeiro o script create_default_categories.sql';
    END IF;
END $$;

-- 2. Verificar o resultado
SELECT 
    i.id,
    i.title,
    i.category_id,
    c.name as category_name,
    c.type as category_type,
    c.color as category_color
FROM invoices i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.organization_id = '247'
ORDER BY i.created_at DESC;

-- 3. Mostrar estatísticas finais
SELECT 
    COUNT(*) as total_faturas,
    COUNT(category_id) as faturas_com_categoria,
    COUNT(*) - COUNT(category_id) as faturas_sem_categoria
FROM invoices 
WHERE organization_id = '247';