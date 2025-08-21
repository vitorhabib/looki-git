-- Script para configurar o sistema de Master Admin
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Criar tabela master_admins
CREATE TABLE IF NOT EXISTS master_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Garantir que um usuário só pode ser master admin uma vez
    UNIQUE(user_id)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_master_admins_user_id ON master_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_master_admins_created_at ON master_admins(created_at);

-- 3. Função para verificar se um usuário é master admin
CREATE OR REPLACE FUNCTION is_master_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM master_admins 
        WHERE user_id = user_uuid
    );
END;
$$;

-- 4. Políticas de RLS para master_admins
ALTER TABLE master_admins ENABLE ROW LEVEL SECURITY;

-- Apenas master admins podem ver a tabela master_admins
CREATE POLICY "Master admins can view master_admins" ON master_admins
    FOR SELECT USING (is_master_admin(auth.uid()));

-- Apenas master admins podem inserir novos master admins
CREATE POLICY "Master admins can insert master_admins" ON master_admins
    FOR INSERT WITH CHECK (is_master_admin(auth.uid()));

-- Apenas master admins podem deletar master admins
CREATE POLICY "Master admins can delete master_admins" ON master_admins
    FOR DELETE USING (is_master_admin(auth.uid()));

-- 5. Políticas especiais para master admins acessarem todas as organizações
-- Master admins podem ver todas as organizações
CREATE POLICY "Master admins can view all organizations" ON organizations
    FOR SELECT USING (is_master_admin(auth.uid()));

-- Master admins podem ver todos os relacionamentos user_organizations
CREATE POLICY "Master admins can view all user_organizations" ON user_organizations
    FOR SELECT USING (is_master_admin(auth.uid()));

-- Master admins podem ver todos os clientes
CREATE POLICY "Master admins can view all clients" ON clients
    FOR SELECT USING (is_master_admin(auth.uid()));

-- Master admins podem ver todas as faturas
CREATE POLICY "Master admins can view all invoices" ON invoices
    FOR SELECT USING (is_master_admin(auth.uid()));

-- Master admins podem ver todas as despesas
CREATE POLICY "Master admins can view all expenses" ON expenses
    FOR SELECT USING (is_master_admin(auth.uid()));

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_admins_updated_at BEFORE UPDATE ON master_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Funções para gerenciar master admins
CREATE OR REPLACE FUNCTION promote_to_master_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é master admin
    IF NOT is_master_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Apenas master admins podem promover usuários';
    END IF;
    
    -- Inserir o novo master admin
    INSERT INTO master_admins (user_id, created_by)
    VALUES (target_user_id, auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION remove_master_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é master admin
    IF NOT is_master_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Apenas master admins podem remover usuários';
    END IF;
    
    -- Não permitir que um master admin remova a si mesmo
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode remover seu próprio acesso de master admin';
    END IF;
    
    -- Remover o master admin
    DELETE FROM master_admins WHERE user_id = target_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 8. Criar tabela de configurações globais
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  max_users_per_org INTEGER DEFAULT 50,
  max_invoices_per_month INTEGER DEFAULT 1000,
  storage_limit_gb INTEGER DEFAULT 10,
  features_enabled JSONB DEFAULT '{
    "advanced_reports": true,
    "api_access": true,
    "custom_branding": false,
    "priority_support": false
  }'::jsonb,
  maintenance_mode BOOLEAN DEFAULT false,
  system_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Política para master admins lerem configurações globais
CREATE POLICY "Master admins can read global settings" ON global_settings
  FOR SELECT USING (is_master_admin(auth.uid()));

-- Política para master admins atualizarem configurações globais
CREATE POLICY "Master admins can update global settings" ON global_settings
  FOR UPDATE USING (is_master_admin(auth.uid()));

-- Política para master admins inserirem configurações globais
CREATE POLICY "Master admins can insert global settings" ON global_settings
  FOR INSERT WITH CHECK (is_master_admin(auth.uid()));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente na tabela global_settings
CREATE TRIGGER update_global_settings_updated_at
  BEFORE UPDATE ON global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. View para estatísticas do SaaS (apenas para master admins)
CREATE OR REPLACE VIEW saas_stats AS
SELECT 
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM user_organizations) as total_user_org_relationships,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM invoices) as total_invoices,
    (SELECT COUNT(*) FROM expenses) as total_expenses,
    (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') as total_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expenses_amount,
    (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices,
    (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices;

-- Política para a view saas_stats
ALTER VIEW saas_stats OWNER TO postgres;
GRANT SELECT ON saas_stats TO authenticated;

-- 9. Criar o primeiro master admin (substitua 'SEU_USER_ID' pelo ID do seu usuário)
-- Para encontrar seu user ID, execute: SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
-- INSERT INTO master_admins (user_id, created_by) VALUES ('SEU_USER_ID', 'SEU_USER_ID');

-- Exemplo de como encontrar e promover o primeiro master admin:
-- SELECT id, email FROM auth.users WHERE email = 'admin@exemplo.com';
-- INSERT INTO master_admins (user_id, created_by) VALUES ('uuid-do-usuario', 'uuid-do-usuario');

COMMIT;