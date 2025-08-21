-- Script para adicionar colunas faltantes à tabela invoices
-- Execute este script no Supabase Dashboard > SQL Editor

-- Adicionar coluna discount_amount à tabela invoices se ela não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Adicionar coluna payment_method à tabela invoices se ela não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Adicionar coluna paid_at à tabela invoices se ela não existir
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN invoices.discount_amount IS 'Valor do desconto aplicado à fatura';
COMMENT ON COLUMN invoices.payment_method IS 'Método de pagamento utilizado';
COMMENT ON COLUMN invoices.paid_at IS 'Data e hora do pagamento';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('discount_amount', 'payment_method', 'paid_at')
ORDER BY column_name;