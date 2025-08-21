-- =====================================================
-- MIGRAÇÃO: ESTRUTURA PARA ADMINISTRADOR MASTER
-- Adiciona suporte para super administradores do SaaS
-- =====================================================

-- 1. Criar tabela para administradores master
CREATE TABLE IF NOT EXISTS master_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_master_admins_user_id ON master_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_master_admins_email ON master_admins(email);
CREATE INDEX IF NOT EXISTS idx_master_admins_active ON master_admins(is_active);

-- 3. Função para verificar se usuário é master admin
CREATE OR REPLACE FUNCTION is_master_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM master_admins 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS na tabela master_admins
ALTER TABLE master_admins ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para master_admins
-- Apenas master admins podem ver outros master admins
CREATE POLICY "Master admins can view master admins" ON master_admins
  FOR SELECT USING (is_master_admin());

-- Apenas master admins podem inserir novos master admins
CREATE POLICY "Master admins can insert master admins" ON master_admins
  FOR INSERT WITH CHECK (is_master_admin());

-- Apenas master admins podem atualizar master admins
CREATE POLICY "Master admins can update master admins" ON master_admins
  FOR UPDATE USING (is_master_admin());

-- Apenas master admins podem deletar master admins
CREATE POLICY "Master admins can delete master admins" ON master_admins
  FOR DELETE USING (is_master_admin());

-- 6. Modificar políticas existentes para permitir acesso de master admin
-- Organizações: Master admins podem ver todas as organizações
CREATE POLICY "Master admins can view all organizations" ON organizations
  FOR SELECT USING (is_master_admin());

-- Organizações: Master admins podem atualizar qualquer organização
CREATE POLICY "Master admins can update all organizations" ON organizations
  FOR UPDATE USING (is_master_admin());

-- Organizações: Master admins podem deletar qualquer organização
CREATE POLICY "Master admins can delete all organizations" ON organizations
  FOR DELETE USING (is_master_admin());

-- User Organizations: Master admins podem ver todos os relacionamentos
CREATE POLICY "Master admins can view all user organizations" ON user_organizations
  FOR SELECT USING (is_master_admin());

-- User Organizations: Master admins podem gerenciar qualquer relacionamento
CREATE POLICY "Master admins can manage all user organizations" ON user_organizations
  FOR ALL USING (is_master_admin());

-- 7. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_master_admins_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_master_admins_updated_at 
  BEFORE UPDATE ON master_admins
  FOR EACH ROW EXECUTE FUNCTION update_master_admins_updated_at_column();

-- 8. Função para promover usuário a master admin
CREATE OR REPLACE FUNCTION promote_to_master_admin(
  target_user_id UUID,
  target_email VARCHAR(255),
  target_full_name VARCHAR(255) DEFAULT NULL,
  target_permissions JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_admin_id UUID;
BEGIN
  -- Verificar se o usuário atual é master admin (exceto se for o primeiro)
  IF EXISTS (SELECT 1 FROM master_admins LIMIT 1) AND NOT is_master_admin() THEN
    RAISE EXCEPTION 'Apenas master admins podem promover outros usuários';
  END IF;
  
  -- Inserir novo master admin
  INSERT INTO master_admins (user_id, email, full_name, permissions, created_by)
  VALUES (target_user_id, target_email, target_full_name, target_permissions, auth.uid())
  RETURNING id INTO new_admin_id;
  
  RETURN new_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para remover master admin
CREATE OR REPLACE FUNCTION remove_master_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é master admin
  IF NOT is_master_admin() THEN
    RAISE EXCEPTION 'Apenas master admins podem remover outros master admins';
  END IF;
  
  -- Não permitir que o último master admin seja removido
  IF (SELECT COUNT(*) FROM master_admins WHERE is_active = true) <= 1 THEN
    RAISE EXCEPTION 'Não é possível remover o último master admin';
  END IF;
  
  -- Remover master admin
  UPDATE master_admins 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. View para estatísticas do SaaS (apenas para master admins)
CREATE OR REPLACE VIEW saas_stats AS
SELECT 
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM user_organizations) as total_users,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COUNT(*) FROM expenses) as total_expenses,
  (SELECT COUNT(*) FROM master_admins WHERE is_active = true) as total_master_admins,
  (SELECT SUM(total_amount) FROM invoices WHERE status = 'paid') as total_revenue,
  (SELECT SUM(amount) FROM expenses WHERE status = 'paid') as total_expenses_amount;

-- RLS para a view
ALTER VIEW saas_stats SET (security_barrier = true);
CREATE POLICY "Master admins can view saas stats" ON saas_stats
  FOR SELECT USING (is_master_admin());

-- 11. Comentários para documentação
COMMENT ON TABLE master_admins IS 'Tabela de administradores master do SaaS';
COMMENT ON COLUMN master_admins.user_id IS 'ID do usuário no auth.users';
COMMENT ON COLUMN master_admins.permissions IS 'Permissões específicas do master admin em formato JSON';
COMMENT ON COLUMN master_admins.is_active IS 'Se o master admin está ativo';
COMMENT ON FUNCTION is_master_admin IS 'Verifica se o usuário atual é um master admin ativo';
COMMENT ON FUNCTION promote_to_master_admin IS 'Promove um usuário a master admin';
COMMENT ON FUNCTION remove_master_admin IS 'Remove/desativa um master admin';
COMMENT ON VIEW saas_stats IS 'Estatísticas gerais do SaaS (apenas para master admins)';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- Para criar o primeiro master admin, execute:
-- SELECT promote_to_master_admin(
--   'USER_ID_AQUI',
--   'admin@exemplo.com',
--   'Nome do Admin',
--   '{"can_manage_users": true, "can_view_analytics": true}'
-- );
--
-- Para verificar se um usuário é master admin:
-- SELECT is_master_admin('USER_ID_AQUI');
--
-- Para ver estatísticas do SaaS:
-- SELECT * FROM saas_stats;
-- =====================================================