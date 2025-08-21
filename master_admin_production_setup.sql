-- =====================================================
-- SETUP MASTER ADMIN PARA PRODUÇÃO
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- PARTE 1: ESTRUTURA MASTER ADMIN
-- =====================================================

-- 1. Criar tabela master_admins
CREATE TABLE IF NOT EXISTS master_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  permissions JSONB DEFAULT '{"all": true}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_master_admins_user_id ON master_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_master_admins_email ON master_admins(email);
CREATE INDEX IF NOT EXISTS idx_master_admins_active ON master_admins(is_active);

-- 3. Função is_master_admin
CREATE OR REPLACE FUNCTION is_master_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM master_admins 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS
ALTER TABLE master_admins ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para master_admins
DROP POLICY IF EXISTS "Master admins can view master admins" ON master_admins;
CREATE POLICY "Master admins can view master admins" ON master_admins
  FOR SELECT USING (is_master_admin());

DROP POLICY IF EXISTS "Master admins can insert master admins" ON master_admins;
CREATE POLICY "Master admins can insert master admins" ON master_admins
  FOR INSERT WITH CHECK (is_master_admin());

DROP POLICY IF EXISTS "Master admins can update master admins" ON master_admins;
CREATE POLICY "Master admins can update master admins" ON master_admins
  FOR UPDATE USING (is_master_admin());

DROP POLICY IF EXISTS "Master admins can delete master admins" ON master_admins;
CREATE POLICY "Master admins can delete master admins" ON master_admins
  FOR DELETE USING (is_master_admin());

-- PARTE 2: POLÍTICAS PARA ACESSO GLOBAL
-- =====================================================

-- Master admins podem ver todas as organizações
DROP POLICY IF EXISTS "Master admins can view all organizations" ON organizations;
CREATE POLICY "Master admins can view all organizations" ON organizations
  FOR SELECT USING (is_master_admin());

-- Master admins podem atualizar organizações
DROP POLICY IF EXISTS "Master admins can update all organizations" ON organizations;
CREATE POLICY "Master admins can update all organizations" ON organizations
  FOR UPDATE USING (is_master_admin());

-- Master admins podem ver todos os relacionamentos user_organizations
DROP POLICY IF EXISTS "Master admins can view all user organizations" ON user_organizations;
CREATE POLICY "Master admins can view all user organizations" ON user_organizations
  FOR SELECT USING (is_master_admin());

-- Master admins podem gerenciar user_organizations
DROP POLICY IF EXISTS "Master admins can manage all user organizations" ON user_organizations;
CREATE POLICY "Master admins can manage all user organizations" ON user_organizations
  FOR ALL USING (is_master_admin());

-- Master admins podem ver todos os clientes
DROP POLICY IF EXISTS "Master admins can view all clients" ON clients;
CREATE POLICY "Master admins can view all clients" ON clients
  FOR SELECT USING (is_master_admin());

-- Master admins podem ver todas as faturas
DROP POLICY IF EXISTS "Master admins can view all invoices" ON invoices;
CREATE POLICY "Master admins can view all invoices" ON invoices
  FOR SELECT USING (is_master_admin());

-- Master admins podem ver todas as despesas
DROP POLICY IF EXISTS "Master admins can view all expenses" ON expenses;
CREATE POLICY "Master admins can view all expenses" ON expenses
  FOR SELECT USING (is_master_admin());

-- Master admins podem ver todas as categorias
DROP POLICY IF EXISTS "Master admins can view all categories" ON categories;
CREATE POLICY "Master admins can view all categories" ON categories
  FOR SELECT USING (is_master_admin());

-- PARTE 3: FUNÇÕES DE GERENCIAMENTO
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_master_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_master_admins_updated_at ON master_admins;
CREATE TRIGGER update_master_admins_updated_at 
  BEFORE UPDATE ON master_admins
  FOR EACH ROW EXECUTE FUNCTION update_master_admins_updated_at();

-- Função para promover usuário a master admin
CREATE OR REPLACE FUNCTION promote_to_master_admin(
  target_user_id UUID,
  target_email VARCHAR(255),
  target_full_name VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_admin_id UUID;
BEGIN
  -- Permitir criação do primeiro master admin sem verificação
  IF EXISTS (SELECT 1 FROM master_admins WHERE is_active = true LIMIT 1) AND NOT is_master_admin() THEN
    RAISE EXCEPTION 'Apenas master admins podem promover outros usuários';
  END IF;
  
  -- Inserir novo master admin
  INSERT INTO master_admins (user_id, email, full_name, created_by)
  VALUES (target_user_id, target_email, target_full_name, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO new_admin_id;
  
  RETURN new_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover master admin
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
  
  -- Desativar master admin
  UPDATE master_admins 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 4: VIEW PARA ESTATÍSTICAS DO SAAS
-- =====================================================

CREATE OR REPLACE VIEW saas_stats AS
SELECT 
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM user_organizations) as total_users,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COUNT(*) FROM expenses) as total_expenses,
  (SELECT COUNT(*) FROM master_admins WHERE is_active = true) as total_master_admins,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'paid') as total_expenses_amount,
  (SELECT COUNT(*) FROM organizations WHERE created_at >= NOW() - INTERVAL '30 days') as new_orgs_last_30_days,
  (SELECT COUNT(*) FROM user_organizations WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_last_30_days;

-- Política para a view saas_stats
ALTER VIEW saas_stats OWNER TO postgres;
GRANT SELECT ON saas_stats TO authenticated;

-- RLS para a view (apenas master admins)
CREATE POLICY "Master admins can view saas stats" ON saas_stats
  FOR SELECT USING (is_master_admin());

-- PARTE 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE master_admins IS 'Administradores master do SaaS com acesso global';
COMMENT ON COLUMN master_admins.user_id IS 'Referência ao usuário em auth.users';
COMMENT ON COLUMN master_admins.permissions IS 'Permissões específicas em formato JSON';
COMMENT ON COLUMN master_admins.is_active IS 'Status ativo do master admin';
COMMENT ON FUNCTION is_master_admin IS 'Verifica se o usuário é um master admin ativo';
COMMENT ON FUNCTION promote_to_master_admin IS 'Promove usuário a master admin';
COMMENT ON FUNCTION remove_master_admin IS 'Remove/desativa master admin';
COMMENT ON VIEW saas_stats IS 'Estatísticas gerais do SaaS para master admins';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Para criar o primeiro master admin, use:
--    SELECT promote_to_master_admin(
--      'USER_ID_DO_SUPABASE',
--      'seu-email@exemplo.com',
--      'Seu Nome Completo'
--    );
-- 3. Para verificar se funcionou:
--    SELECT * FROM master_admins;
--    SELECT is_master_admin('USER_ID_DO_SUPABASE');
-- 4. Para ver estatísticas:
--    SELECT * FROM saas_stats;
-- =====================================================

-- Verificação final
SELECT 'Setup Master Admin concluído!' as status;