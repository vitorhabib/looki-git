-- Script para adicionar políticas de exclusão em cascata para organizações
-- Este script garante que quando uma organização for excluída, todos os dados relacionados sejam excluídos automaticamente

-- 1. Adicionar constraint de CASCADE para a tabela categories
ALTER TABLE categories 
DROP CONSTRAINT IF EXISTS categories_organization_id_fkey;

ALTER TABLE categories 
ADD CONSTRAINT categories_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Adicionar constraint de CASCADE para a tabela expenses
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_organization_id_fkey;

ALTER TABLE expenses 
ADD CONSTRAINT expenses_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Verificar se a tabela clients tem constraint de CASCADE (caso exista)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        -- Remover constraint existente se houver
        ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_organization_id_fkey;
        
        -- Adicionar nova constraint com CASCADE
        ALTER TABLE clients ADD CONSTRAINT clients_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Verificar constraints existentes após as alterações
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'organizations'
ORDER BY tc.table_name, tc.constraint_name;

COMMIT;

-- Mensagem de confirmação
SELECT 'Políticas de exclusão em cascata configuradas com sucesso!' as status;