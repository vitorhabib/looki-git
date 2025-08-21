-- Remover políticas RLS incorretas da tabela categories
DROP POLICY IF EXISTS "Users can view categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can create categories for their organization" ON categories;
DROP POLICY IF EXISTS "Users can update categories from their organization" ON categories;
DROP POLICY IF EXISTS "Users can delete categories from their organization" ON categories;

-- Criar políticas RLS corretas para a tabela categories
-- Usuários podem ver categorias das organizações às quais pertencem
CREATE POLICY "Users can view categories from their organizations" ON categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir categorias para organizações às quais pertencem
CREATE POLICY "Users can insert categories for their organizations" ON categories
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar categorias das organizações às quais pertencem
CREATE POLICY "Users can update categories from their organizations" ON categories
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem deletar categorias das organizações às quais pertencem
CREATE POLICY "Users can delete categories from their organizations" ON categories
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política para administradores mestres (se existir a função)
CREATE POLICY "Master admins can manage all categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM master_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );