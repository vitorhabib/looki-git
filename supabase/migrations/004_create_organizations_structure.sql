-- Migração para criar estrutura de organizações
-- Esta migração cria a estrutura correta onde usuários pertencem a organizações
-- e as despesas são associadas às organizações, não diretamente aos usuários

-- 1. Criar tabela de organizações
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de relacionamento usuário-organização
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para organizações
-- Usuários podem ver organizações das quais fazem parte
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Usuários podem criar organizações
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Apenas owners e admins podem atualizar organizações
CREATE POLICY "Owners and admins can update organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 6. Políticas para user_organizations
-- Usuários podem ver seus próprios relacionamentos
CREATE POLICY "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- Owners e admins podem gerenciar membros
CREATE POLICY "Owners and admins can manage members" ON user_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 7. Atualizar políticas de despesas para usar a nova estrutura
DROP POLICY IF EXISTS "Users can view own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own organization expenses" ON expenses;

-- Novas políticas para despesas baseadas em organizações
CREATE POLICY "Users can view expenses from their organizations" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses for their organizations" ON expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses from their organizations" ON expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses from their organizations" ON expenses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 8. Atualizar políticas de categorias também
DROP POLICY IF EXISTS "Users can view own organization categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own organization categories" ON categories;
DROP POLICY IF EXISTS "Users can update own organization categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own organization categories" ON categories;

CREATE POLICY "Users can view categories from their organizations" ON categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories for their organizations" ON categories
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories from their organizations" ON categories
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories from their organizations" ON categories
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 9. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_organizations_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_organizations_updated_at_column();

-- 10. Comentários para documentação
COMMENT ON TABLE organizations IS 'Tabela de organizações/empresas';
COMMENT ON TABLE user_organizations IS 'Relacionamento entre usuários e organizações';
COMMENT ON COLUMN organizations.name IS 'Nome da organização';
COMMENT ON COLUMN organizations.created_by IS 'Usuário que criou a organização';
COMMENT ON COLUMN user_organizations.role IS 'Papel do usuário na organização: owner, admin, member';