-- Remover políticas RLS incorretas da tabela expenses
DROP POLICY IF EXISTS "Users can view own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own organization expenses" ON expenses;

-- Criar políticas RLS corretas para a tabela expenses
-- Usuários podem ver despesas das organizações às quais pertencem
CREATE POLICY "Users can view expenses from their organizations" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem inserir despesas para organizações às quais pertencem
CREATE POLICY "Users can insert expenses for their organizations" ON expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem atualizar despesas das organizações às quais pertencem
CREATE POLICY "Users can update expenses from their organizations" ON expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem deletar despesas das organizações às quais pertencem
CREATE POLICY "Users can delete expenses from their organizations" ON expenses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Política para administradores mestres (se existir a função)
CREATE POLICY "Master admins can manage all expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM master_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );