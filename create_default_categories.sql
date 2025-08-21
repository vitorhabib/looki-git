-- Script para criar categorias padrão para a organização '247'
-- Execute este script no Supabase Dashboard após fazer login na aplicação

-- Verificar se o usuário está autenticado
DO $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não está autenticado. Faça login na aplicação primeiro.';
  END IF;
END $$;

-- Inserir categorias padrão para a organização '247'
INSERT INTO categories (name, description, type, color, organization_id) VALUES
  ('Marketing Digital', 'Gastos com publicidade online, redes sociais e campanhas digitais', 'expense', '#ef4444', '247'),
  ('Escritório', 'Aluguel, energia, internet e materiais de escritório', 'expense', '#3b82f6', '247'),
  ('Pessoal', 'Salários, benefícios e encargos trabalhistas', 'expense', '#f59e0b', '247'),
  ('Vendas de Produtos', 'Receita proveniente da venda de produtos', 'revenue', '#10b981', '247'),
  ('Serviços', 'Receita de prestação de serviços', 'revenue', '#8b5cf6', '247'),
  ('Consultoria', 'Receita de serviços de consultoria', 'revenue', '#14b8a6', '247'),
  ('Desenvolvimento Web', 'Receita de projetos de desenvolvimento web', 'revenue', '#06b6d4', '247'),
  ('Design Gráfico', 'Receita de serviços de design', 'revenue', '#ec4899', '247')
ON CONFLICT (name, organization_id) DO NOTHING;

-- Verificar se as categorias foram criadas
SELECT 
  id,
  name,
  type,
  color,
  organization_id,
  created_at
FROM categories 
WHERE organization_id = '247'
ORDER BY type, name;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Categorias padrão criadas com sucesso para a organização 247!';
END $$;