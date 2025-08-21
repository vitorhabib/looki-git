-- Execute este SQL diretamente no seu banco de dados Supabase
-- para adicionar a coluna category_id à tabela invoices

-- Adicionar coluna category_id à tabela invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_invoices_category_id ON invoices(category_id);

-- Adicionar comentário para documentação
COMMENT ON COLUMN invoices.category_id IS 'ID da categoria de receita associada à fatura';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'category_id';