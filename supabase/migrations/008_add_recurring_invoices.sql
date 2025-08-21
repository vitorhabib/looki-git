-- Migração para adicionar funcionalidade de faturas recorrentes
-- Adiciona campos para controlar se uma fatura é recorrente e sua frequência

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS next_recurring_date DATE;

-- Índices para performance das consultas de faturas recorrentes
CREATE INDEX IF NOT EXISTS idx_invoices_is_recurring ON invoices(is_recurring);
CREATE INDEX IF NOT EXISTS idx_invoices_next_recurring_date ON invoices(next_recurring_date);
CREATE INDEX IF NOT EXISTS idx_invoices_parent_invoice_id ON invoices(parent_invoice_id);

-- Função para calcular a próxima data de recorrência
CREATE OR REPLACE FUNCTION calculate_next_recurring_date(
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

-- Função para gerar faturas recorrentes
CREATE OR REPLACE FUNCTION generate_recurring_invoices()
RETURNS INTEGER AS $$
DECLARE
  recurring_invoice RECORD;
  new_invoice_id UUID;
  generated_count INTEGER := 0;
BEGIN
  -- Buscar faturas recorrentes que precisam gerar nova fatura
  FOR recurring_invoice IN
    SELECT *
    FROM invoices
    WHERE is_recurring = TRUE
      AND next_recurring_date <= CURRENT_DATE
      AND (recurring_end_date IS NULL OR recurring_end_date >= CURRENT_DATE)
      AND status != 'cancelled'
  LOOP
    -- Gerar nova fatura baseada na fatura recorrente
    INSERT INTO invoices (
      invoice_number,
      client_id,
      organization_id,
      issue_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      notes,
      payment_terms,
      payment_method,
      parent_invoice_id,
      is_recurring,
      recurring_frequency,
      recurring_start_date,
      recurring_end_date,
      next_recurring_date
    )
    VALUES (
      'REC-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-' || LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0') || '-' || SUBSTRING(recurring_invoice.id::TEXT, 1, 8),
      recurring_invoice.client_id,
      recurring_invoice.organization_id,
      CURRENT_DATE,
      CURRENT_DATE + (recurring_invoice.due_date - recurring_invoice.issue_date),
      'draft',
      recurring_invoice.subtotal,
      recurring_invoice.tax_amount,
      recurring_invoice.discount_amount,
      recurring_invoice.total_amount,
      COALESCE(recurring_invoice.notes, '') || ' (Fatura recorrente gerada automaticamente)',
      recurring_invoice.payment_terms,
      recurring_invoice.payment_method,
      recurring_invoice.id,
      FALSE, -- A nova fatura não é recorrente
      NULL,
      NULL,
      NULL,
      NULL
    )
    RETURNING id INTO new_invoice_id;

    -- Copiar itens da fatura original para a nova fatura
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
    SELECT new_invoice_id, description, quantity, unit_price, total_price
    FROM invoice_items
    WHERE invoice_id = recurring_invoice.id;

    -- Atualizar a próxima data de recorrência na fatura original
    UPDATE invoices
    SET next_recurring_date = calculate_next_recurring_date(next_recurring_date, recurring_frequency)
    WHERE id = recurring_invoice.id;

    generated_count := generated_count + 1;
  END LOOP;

  RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN invoices.is_recurring IS 'Indica se a fatura é recorrente';
COMMENT ON COLUMN invoices.recurring_frequency IS 'Frequência da recorrência: monthly, quarterly, yearly';
COMMENT ON COLUMN invoices.recurring_start_date IS 'Data de início da recorrência';
COMMENT ON COLUMN invoices.recurring_end_date IS 'Data de fim da recorrência (opcional)';
COMMENT ON COLUMN invoices.parent_invoice_id IS 'ID da fatura pai (para faturas geradas automaticamente)';
COMMENT ON COLUMN invoices.next_recurring_date IS 'Próxima data para gerar fatura recorrente';