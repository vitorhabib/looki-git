-- =====================================================
-- SISTEMA DE AUDITORIA E LOGS
-- =====================================================

-- 1. Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    table_name VARCHAR(100), -- Nome da tabela afetada
    record_id UUID, -- ID do registro afetado
    old_values JSONB, -- Valores antigos (para UPDATE e DELETE)
    new_values JSONB, -- Valores novos (para CREATE e UPDATE)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB, -- Informações adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de logs de sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR, FATAL
    message TEXT NOT NULL,
    component VARCHAR(100), -- Nome do componente/módulo
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    error_details JSONB, -- Stack trace, error code, etc.
    metadata JSONB, -- Informações adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, PAGE_VIEW, API_CALL
    resource VARCHAR(200), -- URL ou recurso acessado
    method VARCHAR(10), -- GET, POST, PUT, DELETE
    status_code INTEGER, -- HTTP status code
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    duration_ms INTEGER, -- Duração da requisição em ms
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
-- Master admins podem ver todos os logs
CREATE POLICY "Master admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM master_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Usuários podem ver apenas logs da sua organização
CREATE POLICY "Users can view own organization audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Sistema pode inserir logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 7. Políticas de segurança para system_logs
-- Apenas master admins podem ver logs do sistema
CREATE POLICY "Master admins can view system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM master_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Sistema pode inserir logs
CREATE POLICY "System can insert system logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- 8. Políticas de segurança para access_logs
-- Master admins podem ver todos os logs de acesso
CREATE POLICY "Master admins can view all access logs" ON access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM master_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Usuários podem ver apenas logs de acesso da sua organização
CREATE POLICY "Users can view own organization access logs" ON access_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Sistema pode inserir logs
CREATE POLICY "System can insert access logs" ON access_logs
    FOR INSERT WITH CHECK (true);

-- 9. Função para criar log de auditoria
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

-- 10. Função para criar log do sistema
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

-- 11. Função para criar log de acesso
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

-- 12. View para estatísticas de auditoria
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
    (SELECT COUNT(*) FROM audit_logs) as total_audit_logs,
    (SELECT COUNT(*) FROM system_logs) as total_system_logs,
    (SELECT COUNT(*) FROM access_logs) as total_access_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as audit_logs_last_24h,
    (SELECT COUNT(*) FROM system_logs WHERE level = 'ERROR' AND created_at >= NOW() - INTERVAL '24 hours') as errors_last_24h,
    (SELECT COUNT(*) FROM access_logs WHERE action = 'LOGIN' AND created_at >= NOW() - INTERVAL '24 hours') as logins_last_24h,
    (SELECT COUNT(DISTINCT user_id) FROM access_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users_last_24h;

-- Política para a view audit_stats (apenas master admins)
ALTER VIEW audit_stats OWNER TO postgres;
GRANT SELECT ON audit_stats TO authenticated;

-- 13. Trigger para limpeza automática de logs antigos (opcional)
-- Manter apenas logs dos últimos 12 meses
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '12 months';
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '12 months';
    DELETE FROM access_logs WHERE created_at < NOW() - INTERVAL '12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastrear ações dos usuários';
COMMENT ON TABLE system_logs IS 'Logs do sistema para rastrear eventos e erros';
COMMENT ON TABLE access_logs IS 'Logs de acesso para rastrear requisições e navegação';
COMMENT ON FUNCTION create_audit_log IS 'Função para criar logs de auditoria';
COMMENT ON FUNCTION create_system_log IS 'Função para criar logs do sistema';
COMMENT ON FUNCTION create_access_log IS 'Função para criar logs de acesso';
COMMENT ON VIEW audit_stats IS 'Estatísticas dos logs de auditoria';