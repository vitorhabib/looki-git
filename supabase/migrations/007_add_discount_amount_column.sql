-- Adicionar coluna discount_amount à tabela invoices se ela não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN invoices.discount_amount IS 'Valor do desconto aplicado à fatura';