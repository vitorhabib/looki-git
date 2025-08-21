-- Script para verificar e corrigir políticas RLS e constraints no Supabase
-- Este script serve como documentação e verificação das políticas de segurança

-- =====================================================
-- VERIFICAÇÃO DE POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Verificar políticas da tabela expenses
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

-- Verificar políticas da tabela invoices
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
WHERE tablename = 'invoices'
ORDER BY policyname;

-- Verificar políticas da tabela clients
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
WHERE tablename = 'clients'
ORDER BY policyname;

-- Verificar políticas da tabela categories
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
WHERE tablename = 'categories'
ORDER BY policyname;

-- =====================================================
-- VERIFICAÇÃO DE CONSTRAINTS E FOREIGN KEYS
-- =====================================================

-- Verificar constraints da tabela expenses
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'expenses'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Verificar constraints da tabela invoices
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'invoices'
ORDER BY tc.constraint_type, tc.constraint_name;

-- =====================================================
-- CORREÇÕES E MELHORIAS SUGERIDAS
-- =====================================================

-- Garantir que RLS está habilitado em todas as tabelas principais
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE BACKUP/FALLBACK PARA EXPENSES
-- =====================================================

-- Política de fallback para expenses (caso as políticas principais falhem)
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expenses' 
        AND policyname = 'expenses_organization_access_fallback'
    ) THEN
        CREATE POLICY "expenses_organization_access_fallback" ON expenses
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
        WITH CHECK (
            organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

-- =====================================================
-- POLÍTICAS DE BACKUP/FALLBACK PARA INVOICES
-- =====================================================

-- Política de fallback para invoices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' 
        AND policyname = 'invoices_organization_access_fallback'
    ) THEN
        CREATE POLICY "invoices_organization_access_fallback" ON invoices
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
        WITH CHECK (
            organization_id IN (
                SELECT organization_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END
$$;

-- =====================================================
-- VALIDAÇÕES DE INTEGRIDADE DE DADOS
-- =====================================================

-- Verificar se existem registros órfãos (sem organization_id válido)
SELECT 'expenses' as table_name, COUNT(*) as orphaned_records
FROM expenses e
WHERE e.organization_id IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM organizations o 
       WHERE o.id = e.organization_id
   )

UNION ALL

SELECT 'invoices' as table_name, COUNT(*) as orphaned_records
FROM invoices i
WHERE i.organization_id IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM organizations o 
       WHERE o.id = i.organization_id
   )

UNION ALL

SELECT 'clients' as table_name, COUNT(*) as orphaned_records
FROM clients c
WHERE c.organization_id IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM organizations o 
       WHERE o.id = c.organization_id
   )

UNION ALL

SELECT 'categories' as table_name, COUNT(*) as orphaned_records
FROM categories cat
WHERE cat.organization_id IS NULL 
   OR NOT EXISTS (
       SELECT 1 FROM organizations o 
       WHERE o.id = cat.organization_id
   );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Criar índices para melhorar performance das consultas com organization_id
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON invoices(organization_id, issue_date DESC);

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE expenses IS 'Tabela de despesas com RLS baseado em organization_id';
COMMENT ON TABLE invoices IS 'Tabela de faturas com RLS baseado em organization_id';
COMMENT ON TABLE clients IS 'Tabela de clientes com RLS baseado em organization_id';
COMMENT ON TABLE categories IS 'Tabela de categorias com RLS baseado em organization_id';

COMMENT ON COLUMN expenses.organization_id IS 'FK para organizations - usado nas políticas RLS';
COMMENT ON COLUMN invoices.organization_id IS 'FK para organizations - usado nas políticas RLS';
COMMENT ON COLUMN clients.organization_id IS 'FK para organizations - usado nas políticas RLS';
COMMENT ON COLUMN categories.organization_id IS 'FK para organizations - usado nas políticas RLS';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('expenses', 'invoices', 'clients', 'categories', 'invoice_items')
ORDER BY tablename;

-- Contar políticas por tabela
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('expenses', 'invoices', 'clients', 'categories', 'invoice_items')
GROUP BY tablename
ORDER BY tablename;