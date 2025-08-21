-- Criação da tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'cash',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  receipt_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

-- Habilitar Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Usuários podem ver apenas despesas da sua organização
CREATE POLICY "Users can view own organization expenses" ON expenses
  FOR SELECT USING (organization_id = auth.uid());

-- Usuários podem inserir despesas apenas para sua organização
CREATE POLICY "Users can insert own organization expenses" ON expenses
  FOR INSERT WITH CHECK (organization_id = auth.uid());

-- Usuários podem atualizar apenas despesas da sua organização
CREATE POLICY "Users can update own organization expenses" ON expenses
  FOR UPDATE USING (organization_id = auth.uid());

-- Usuários podem deletar apenas despesas da sua organização
CREATE POLICY "Users can delete own organization expenses" ON expenses
  FOR DELETE USING (organization_id = auth.uid());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_expenses_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_expenses_updated_at_column();

-- Inserir algumas despesas de exemplo (opcional)
INSERT INTO expenses (title, description, amount, organization_id, expense_date, payment_method, status) VALUES
  ('Material de Escritório', 'Compra de papel, canetas e materiais diversos', 150.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '5 days', 'credit_card', 'paid'),
  ('Aluguel do Escritório', 'Pagamento mensal do aluguel', 2500.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '3 days', 'bank_transfer', 'paid'),
  ('Internet e Telefone', 'Conta mensal de telecomunicações', 180.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '2 days', 'debit_card', 'paid'),
  ('Marketing Digital', 'Investimento em anúncios Google Ads', 800.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'pending'),
  ('Combustível', 'Abastecimento dos veículos da empresa', 320.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE, 'cash', 'paid')
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE expenses IS 'Tabela para armazenar despesas por organização';
COMMENT ON COLUMN expenses.id IS 'Identificador único da despesa';
COMMENT ON COLUMN expenses.title IS 'Título/nome da despesa';
COMMENT ON COLUMN expenses.description IS 'Descrição detalhada da despesa';
COMMENT ON COLUMN expenses.amount IS 'Valor da despesa em decimal';
COMMENT ON COLUMN expenses.category_id IS 'ID da categoria da despesa (FK para categories)';
COMMENT ON COLUMN expenses.organization_id IS 'ID da organização proprietária da despesa';
COMMENT ON COLUMN expenses.expense_date IS 'Data em que a despesa foi realizada';
COMMENT ON COLUMN expenses.payment_method IS 'Método de pagamento utilizado';
COMMENT ON COLUMN expenses.status IS 'Status da despesa: pending, paid, cancelled';
COMMENT ON COLUMN expenses.receipt_url IS 'URL do comprovante/recibo da despesa';
COMMENT ON COLUMN expenses.tags IS 'Tags para categorização adicional';
COMMENT ON COLUMN expenses.created_at IS 'Data e hora de criação da despesa';
COMMENT ON COLUMN expenses.updated_at IS 'Data e hora da última atualização da despesa';