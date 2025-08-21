-- Migração para adicionar campo de status aos clientes
-- Adiciona campo status com opções: active, inactive, defaulter

-- 1. Adicionar coluna status à tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'defaulter'));

-- 2. Criar índice para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- 3. Criar índice composto para consultas por organização e status
CREATE INDEX IF NOT EXISTS idx_clients_organization_status ON clients(organization_id, status);

-- 4. Comentários para documentação
COMMENT ON COLUMN clients.status IS 'Status do cliente: active (ativo), inactive (desativado), defaulter (inadimplente)';

-- 5. Atualizar trigger de updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela clients se não existir
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Função para contar clientes por status (útil para dashboards)
CREATE OR REPLACE FUNCTION get_clients_count_by_status(org_id UUID)
RETURNS TABLE(
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.status,
        COUNT(*) as count
    FROM clients c
    WHERE c.organization_id = org_id
    GROUP BY c.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para marcar cliente como inadimplente automaticamente
CREATE OR REPLACE FUNCTION mark_defaulter_clients()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Marcar clientes como inadimplentes se tiverem faturas vencidas há mais de 30 dias
    UPDATE clients 
    SET status = 'defaulter'
    WHERE id IN (
        SELECT DISTINCT c.id
        FROM clients c
        INNER JOIN invoices i ON c.id = i.client_id
        WHERE i.status = 'overdue'
        AND i.due_date < CURRENT_DATE - INTERVAL '30 days'
        AND c.status = 'active'
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;