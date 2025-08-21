-- =====================================================
-- SCRIPT COMPLETO PARA CRIAÇÃO DAS TABELAS DE COBRANÇAS
-- Execute este script manualmente no Supabase SQL Editor
-- =====================================================

-- 1. CRIAÇÃO DAS TABELAS DE COBRANÇAS
-- =====================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  document VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Brasil',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para a tabela clients
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Índices para a tabela invoices
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);



-- 3. TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para as tabelas
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- 4. FUNÇÃO PARA CALCULAR TOTAL DA FATURA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;
    
    UPDATE invoices
    SET 
        subtotal = total,
        total_amount = total + tax_amount,
        updated_at = NOW()
    WHERE id = invoice_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- 5. HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;


-- 6. POLÍTICAS DE SEGURANÇA PARA CLIENTS
-- =====================================================

-- Usuários podem ver apenas clientes da sua organização
CREATE POLICY "Users can view own organization clients" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir clientes apenas para organizações das quais fazem parte
CREATE POLICY "Users can insert own organization clients" ON clients
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar apenas clientes da sua organização
CREATE POLICY "Users can update own organization clients" ON clients
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem deletar apenas clientes da sua organização
CREATE POLICY "Users can delete own organization clients" ON clients
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 7. POLÍTICAS DE SEGURANÇA PARA INVOICES
-- =====================================================

-- Usuários podem ver apenas faturas da sua organização
CREATE POLICY "Users can view own organization invoices" ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir faturas apenas para organizações das quais fazem parte
CREATE POLICY "Users can insert own organization invoices" ON invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar apenas faturas da sua organização
CREATE POLICY "Users can update own organization invoices" ON invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem deletar apenas faturas da sua organização
CREATE POLICY "Users can delete own organization invoices" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );



-- 9. COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON TABLE clients IS 'Tabela de clientes associados às organizações';
COMMENT ON TABLE invoices IS 'Tabela de faturas associadas às organizações';


COMMENT ON COLUMN clients.organization_id IS 'ID da organização à qual o cliente pertence';
COMMENT ON COLUMN invoices.organization_id IS 'ID da organização à qual a fatura pertence';
COMMENT ON COLUMN invoices.client_id IS 'ID do cliente para quem a fatura foi emitida';


-- 10. DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================
-- Descomente as linhas abaixo se quiser inserir dados de exemplo
-- IMPORTANTE: Substitua 'YOUR_ORG_ID' pelo ID real da sua organização

/*
-- Exemplo de cliente
INSERT INTO clients (name, email, phone, document, address, city, state, zip_code, organization_id)
VALUES (
  'João Silva',
  'joao.silva@email.com',
  '(11) 99999-9999',
  '123.456.789-00',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'YOUR_ORG_ID'  -- Substitua pelo ID da sua organização
);

-- Exemplo de fatura
INSERT INTO invoices (invoice_number, client_id, organization_id, due_date, status, notes, payment_terms)
VALUES (
  'INV-2024-001',
  (SELECT id FROM clients WHERE email = 'joao.silva@email.com' LIMIT 1),
  'YOUR_ORG_ID',  -- Substitua pelo ID da sua organização
  CURRENT_DATE + INTERVAL '30 days',
  'draft',
  'Primeira fatura de exemplo',
  'Pagamento em 30 dias'
);

-- Exemplo de item de fatura
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
VALUES (
  (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001' LIMIT 1),
  'Consultoria em Marketing Digital',
  1,
  1500.00,
  1500.00
);

-- Atualizar total da fatura
SELECT calculate_invoice_total(
  (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001' LIMIT 1)
);
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('clients', 'invoices');