-- Migração para corrigir as despesas de exemplo
-- Remove as despesas com organization_id fixo e permite que qualquer usuário veja as despesas de exemplo

-- Primeiro, vamos deletar as despesas de exemplo antigas
DELETE FROM expenses WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- Agora vamos criar uma política mais permissiva temporariamente para despesas de exemplo
-- Vamos marcar as despesas de exemplo com um campo especial
ALTER TABLE expenses ADD COLUMN is_sample BOOLEAN DEFAULT FALSE;

-- Criar política para permitir que todos vejam despesas de exemplo
CREATE POLICY "Everyone can view sample expenses" ON expenses
  FOR SELECT USING (is_sample = true);

-- Inserir despesas de exemplo marcadas como sample
INSERT INTO expenses (title, description, amount, organization_id, expense_date, payment_method, status, is_sample, category_id) VALUES
  ('Material de Escritório', 'Compra de papel, canetas e materiais diversos', 150.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '5 days', 'credit_card', 'paid', true, null),
  ('Aluguel do Escritório', 'Pagamento mensal do aluguel', 2500.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '3 days', 'bank_transfer', 'paid', true, null),
  ('Internet e Telefone', 'Conta mensal de telecomunicações', 180.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '2 days', 'debit_card', 'paid', true, null),
  ('Marketing Digital', 'Investimento em anúncios Google Ads', 800.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE - INTERVAL '1 day', 'credit_card', 'pending', true, null),
  ('Combustível', 'Abastecimento dos veículos da empresa', 320.00, '00000000-0000-0000-0000-000000000000', CURRENT_DATE, 'cash', 'paid', true, null)
ON CONFLICT DO NOTHING;

-- Comentário explicativo
COMMENT ON COLUMN expenses.is_sample IS 'Indica se a despesa é um exemplo/demonstração visível para todos os usuários';