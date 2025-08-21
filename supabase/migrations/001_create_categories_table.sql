-- Criação da tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'revenue')),
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas categorias da sua organização
CREATE POLICY "Users can view categories from their organization" ON categories
  FOR SELECT USING (organization_id = auth.uid());

-- Política para usuários criarem categorias na sua organização
CREATE POLICY "Users can create categories for their organization" ON categories
  FOR INSERT WITH CHECK (organization_id = auth.uid());

-- Política para usuários atualizarem categorias da sua organização
CREATE POLICY "Users can update categories from their organization" ON categories
  FOR UPDATE USING (organization_id = auth.uid());

-- Política para usuários excluírem categorias da sua organização
CREATE POLICY "Users can delete categories from their organization" ON categories
  FOR DELETE USING (organization_id = auth.uid());

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas categorias padrão (opcional)
INSERT INTO categories (name, description, type, color, organization_id) VALUES
  ('Marketing Digital', 'Gastos com publicidade online, redes sociais e campanhas digitais', 'expense', '#ef4444', '00000000-0000-0000-0000-000000000000'),
  ('Escritório', 'Aluguel, energia, internet e materiais de escritório', 'expense', '#3b82f6', '00000000-0000-0000-0000-000000000000'),
  ('Pessoal', 'Salários, benefícios e encargos trabalhistas', 'expense', '#f59e0b', '00000000-0000-0000-0000-000000000000'),
  ('Vendas de Produtos', 'Receita proveniente da venda de produtos', 'revenue', '#10b981', '00000000-0000-0000-0000-000000000000'),
  ('Serviços', 'Receita de prestação de serviços', 'revenue', '#8b5cf6', '00000000-0000-0000-0000-000000000000'),
  ('Consultoria', 'Receita de serviços de consultoria', 'revenue', '#14b8a6', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE categories IS 'Tabela para armazenar categorias de despesas e receitas por organização';
COMMENT ON COLUMN categories.id IS 'Identificador único da categoria';
COMMENT ON COLUMN categories.name IS 'Nome da categoria';
COMMENT ON COLUMN categories.description IS 'Descrição detalhada da categoria';
COMMENT ON COLUMN categories.type IS 'Tipo da categoria: expense (despesa) ou revenue (receita)';
COMMENT ON COLUMN categories.color IS 'Cor hexadecimal para identificação visual da categoria';
COMMENT ON COLUMN categories.organization_id IS 'ID da organização proprietária da categoria';
COMMENT ON COLUMN categories.created_at IS 'Data e hora de criação da categoria';
COMMENT ON COLUMN categories.updated_at IS 'Data e hora da última atualização da categoria';