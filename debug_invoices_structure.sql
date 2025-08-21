-- Debug: Verificar estrutura da tabela invoices
-- Execute este script no Supabase Dashboard para identificar as colunas existentes

-- 1. Verificar estrutura da tabela invoices
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se existe alguma coluna relacionada a cliente
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'invoices' 
    AND table_schema = 'public'
    AND (column_name ILIKE '%client%' OR column_name ILIKE '%customer%')
ORDER BY column_name;

-- 3. Verificar algumas linhas da tabela para entender a estrutura
SELECT *
FROM invoices
LIMIT 5;

-- 4. Verificar se existe tabela de clientes relacionada
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND (table_name ILIKE '%client%' OR table_name ILIKE '%customer%')
ORDER BY table_name;

-- 5. Se existir tabela clients, verificar sua estrutura
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'clients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar foreign keys entre invoices e clients
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'invoices' OR ccu.table_name = 'invoices')
ORDER BY tc.table_name, kcu.column_name;

-- 7. Verificar se existe view ou função que combina invoices com client_name
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE viewname ILIKE '%invoice%'
    OR definition ILIKE '%client_name%';

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (routine_name ILIKE '%invoice%' OR routine_definition ILIKE '%client_name%');