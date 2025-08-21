-- Migração para adicionar categoria às faturas
-- Adiciona campo category_id para associar faturas às categorias de receita

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Índice para performance das consultas de faturas por categoria
CREATE INDEX IF NOT EXISTS idx_invoices_category_id ON invoices(category_id);

-- Comentários para documentação
COMMENT ON COLUMN invoices.category_id IS 'ID da categoria de receita associada à fatura';

-- Atualizar as políticas RLS se necessário (as políticas existentes já cobrem este campo)
-- As políticas de RLS existentes para invoices já permitem acesso baseado na organização,
-- então não é necessário criar novas políticas específicas para category_id

-- Exemplo de como consultar faturas com categorias:
-- SELECT i.*, c.name as category_name, c.color as category_color 
-- FROM invoices i 
-- LEFT JOIN categories c ON i.category_id = c.id 
-- WHERE i.organization_id = 'organization_uuid';