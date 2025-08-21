-- =====================================================
-- SETUP COMPLETO: MASTER ADMIN + SISTEMA DE AUDITORIA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PARTE 1: CRIAR ESTRUTURA MASTER ADMIN
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
DROP POLICY IF EXISTS "Master admins can view master admins" ON master_admins;
CREATE POLICY "Master admins can view master admins" ON master_admins
  FOR SELECT USING (is_master_admin());

DROP POLICY IF EXISTS "Master admins can insert master admins" ON master_admins;
CREATE POLICY "Master admins can insert master admins" ON master_admins
  FOR INSERT WITH CHECK (is_master_admin());

DROP POLICY IF EXISTS "Master admins can update master admins" ON master_admins;
CREATE POLICY "Master admins can update master admins" ON master_admins
  FOR UPDATE USING (is_master_admin());

-- PARTE 2: SISTEMA DE AUDITORIA E LOGS
-- =====================================================

-- 1. Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de logs de sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    component VARCHAR(100),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    error_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(200),
    method VARCHAR(10),
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_organization_id ON access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);

-- 5. Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de segurança para audit_logs
DROP POLICY IF EXISTS "Master admins can view all audit logs" ON audit_logs;
CREATE POLICY "Master admins can view all audit logs" ON audit_logs
    FOR SELECT USING (is_master_admin());

DROP POLICY IF EXISTS "Users can view own organization audit logs" ON audit_logs;
CREATE POLICY "Users can view own organization audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 7. Políticas de segurança para system_logs
DROP POLICY IF EXISTS "Master admins can view system logs" ON system_logs;
CREATE POLICY "Master admins can view system logs" ON system_logs
    FOR SELECT USING (is_master_admin());

DROP POLICY IF EXISTS "System can insert system logs" ON system_logs;
CREATE POLICY "System can insert system logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- 8. Políticas de segurança para access_logs
DROP POLICY IF EXISTS "Master admins can view all access logs" ON access_logs;
CREATE POLICY "Master admins can view all access logs" ON access_logs
    FOR SELECT USING (is_master_admin());

DROP POLICY IF EXISTS "Users can view own organization access logs" ON access_logs;
CREATE POLICY "Users can view own organization access logs" ON access_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "System can insert access logs" ON access_logs;
CREATE POLICY "System can insert access logs" ON access_logs
    FOR INSERT WITH CHECK (true);

-- 9. Funções para criar logs
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_organization_id UUID,
    p_action VARCHAR(50),
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, organization_id, action, table_name, record_id,
        old_values, new_values, ip_address, user_agent, session_id, metadata
    ) VALUES (
        p_user_id, p_organization_id, p_action, p_table_name, p_record_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent, p_session_id, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_system_log(
    p_level VARCHAR(20),
    p_message TEXT,
    p_component VARCHAR(100) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO system_logs (
        level, message, component, user_id, organization_id, error_details, metadata
    ) VALUES (
        p_level, p_message, p_component, p_user_id, p_organization_id, p_error_details, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_access_log(
    p_user_id UUID,
    p_organization_id UUID,
    p_action VARCHAR(50),
    p_resource VARCHAR(200),
    p_method VARCHAR(10) DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO access_logs (
        user_id, organization_id, action, resource, method, status_code,
        ip_address, user_agent, session_id, duration_ms, metadata
    ) VALUES (
        p_user_id, p_organization_id, p_action, p_resource, p_method, p_status_code,
        p_ip_address, p_user_agent, p_session_id, p_duration_ms, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. View para estatísticas de auditoria
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
    (SELECT COUNT(*) FROM audit_logs) as total_audit_logs,
    (SELECT COUNT(*) FROM system_logs) as total_system_logs,
    (SELECT COUNT(*) FROM access_logs) as total_access_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as audit_logs_last_24h,
    (SELECT COUNT(*) FROM system_logs WHERE level = 'ERROR' AND created_at >= NOW() - INTERVAL '24 hours') as errors_last_24h,
    (SELECT COUNT(*) FROM access_logs WHERE action = 'LOGIN' AND created_at >= NOW() - INTERVAL '24 hours') as logins_last_24h,
    (SELECT COUNT(DISTINCT user_id) FROM access_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users_last_24h;

ALTER VIEW audit_stats OWNER TO postgres;
GRANT SELECT ON audit_stats TO authenticated;

-- PARTE 3: CRIAR USUÁRIO MASTER ADMIN INICIAL
-- =====================================================

-- IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo seu email real
-- Este usuário precisa estar registrado no auth.users primeiro

-- Exemplo de como adicionar um master admin (descomente e ajuste):
/*
INSERT INTO master_admins (user_id, email, full_name, permissions)
SELECT 
  id,
  email,
  'Master Admin',
  '{"all": true}'
FROM auth.users 
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO NOTHING;
*/

-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 'master_admins' as table_name, COUNT(*) as record_count FROM master_admins
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as record_count FROM audit_logs
UNION ALL
SELECT 'system_logs' as table_name, COUNT(*) as record_count FROM system_logs
UNION ALL
SELECT 'access_logs' as table_name, COUNT(*) as record_count FROM access_logs;

-- Mostrar estrutura das tabelas principais
SELECT 'master_admins' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'master_admins' 
ORDER BY ordinal_position;