-- Adicionar políticas de Row Level Security para as tabelas de cobranças
-- Seguindo o mesmo padrão das despesas, onde usuários só podem acessar dados da sua organização

-- Habilitar Row Level Security nas tabelas de cobranças
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela clients
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

-- Políticas para a tabela invoices
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

-- Políticas para a tabela invoice_items
-- Usuários podem ver apenas itens de faturas da sua organização
CREATE POLICY "Users can view own organization invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Usuários podem inserir itens apenas em faturas da sua organização
CREATE POLICY "Users can insert own organization invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Usuários podem atualizar apenas itens de faturas da sua organização
CREATE POLICY "Users can update own organization invoice items" ON invoice_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Usuários podem deletar apenas itens de faturas da sua organização
CREATE POLICY "Users can delete own organization invoice items" ON invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Comentários explicativos
COMMENT ON TABLE clients IS 'Tabela de clientes associados às organizações';
COMMENT ON TABLE invoices IS 'Tabela de faturas associadas às organizações';
COMMENT ON TABLE invoice_items IS 'Tabela de itens das faturas';

COMMENT ON COLUMN clients.organization_id IS 'ID da organização à qual o cliente pertence';
COMMENT ON COLUMN invoices.organization_id IS 'ID da organização à qual a fatura pertence';
COMMENT ON COLUMN invoices.client_id IS 'ID do cliente para quem a fatura foi emitida';
COMMENT ON COLUMN invoice_items.invoice_id IS 'ID da fatura à qual o item pertence';