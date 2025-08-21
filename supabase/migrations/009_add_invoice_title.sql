-- Adicionar campo title à tabela invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Comentário sobre a nova coluna
COMMENT ON COLUMN invoices.title IS 'Título da fatura para identificação mais fácil';