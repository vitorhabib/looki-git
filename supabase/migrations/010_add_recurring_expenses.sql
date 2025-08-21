-- Migração para adicionar funcionalidade de despesas recorrentes
-- Adiciona campos para controlar se uma despesa é recorrente e sua frequência

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS parent_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS next_recurring_date DATE;

-- Índices para performance das consultas de despesas recorrentes
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS idx_expenses_next_recurring_date ON expenses(next_recurring_date);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON expenses(parent_expense_id);

-- Função para calcular a próxima data de recorrência para despesas
CREATE OR REPLACE FUNCTION calculate_next_recurring_expense_date(
  current_date DATE,
  frequency VARCHAR(20)
) RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'monthly' THEN
      RETURN current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN current_date + INTERVAL '1 year';
    ELSE
      RETURN current_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar despesas recorrentes
CREATE OR REPLACE FUNCTION generate_recurring_expenses()
RETURNS INTEGER AS $$
DECLARE
  recurring_expense RECORD;
  new_expense_id UUID;
  generated_count INTEGER := 0;
BEGIN
  -- Buscar despesas recorrentes que precisam gerar nova despesa
  FOR recurring_expense IN
    SELECT *
    FROM expenses
    WHERE is_recurring = TRUE
      AND next_recurring_date <= CURRENT_DATE
      AND (recurring_end_date IS NULL OR recurring_end_date >= CURRENT_DATE)
      AND status != 'cancelled'
  LOOP
    -- Gerar nova despesa baseada na despesa recorrente
    INSERT INTO expenses (
      title,
      description,
      amount,
      category_id,
      organization_id,
      expense_date,
      payment_method,
      status,
      parent_expense_id,
      is_recurring,
      recurring_frequency,
      recurring_start_date,
      recurring_end_date,
      next_recurring_date
    )
    VALUES (
      recurring_expense.title,
      COALESCE(recurring_expense.description, '') || ' (Despesa recorrente gerada automaticamente)',
      recurring_expense.amount,
      recurring_expense.category_id,
      recurring_expense.organization_id,
      CURRENT_DATE,
      recurring_expense.payment_method,
      'pending',
      recurring_expense.id,
      FALSE, -- A nova despesa não é recorrente
      NULL,
      NULL,
      NULL,
      NULL
    )
    RETURNING id INTO new_expense_id;

    -- Atualizar a próxima data de recorrência na despesa original
    UPDATE expenses
    SET next_recurring_date = calculate_next_recurring_expense_date(next_recurring_date, recurring_frequency)
    WHERE id = recurring_expense.id;

    generated_count := generated_count + 1;
  END LOOP;

  RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN expenses.is_recurring IS 'Indica se a despesa é recorrente';
COMMENT ON COLUMN expenses.recurring_frequency IS 'Frequência da recorrência: monthly, quarterly, yearly';
COMMENT ON COLUMN expenses.recurring_start_date IS 'Data de início da recorrência';
COMMENT ON COLUMN expenses.recurring_end_date IS 'Data de fim da recorrência (opcional)';
COMMENT ON COLUMN expenses.parent_expense_id IS 'ID da despesa pai (para despesas geradas automaticamente)';
COMMENT ON COLUMN expenses.next_recurring_date IS 'Próxima data para gerar despesa recorrente';