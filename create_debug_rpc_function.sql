-- Criar função RPC para executar SQL queries (apenas para superadmin)
-- Execute este script no Supabase Dashboard

-- 1. Criar função para executar SQL (apenas para master admin)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    is_master boolean := false;
BEGIN
    -- Verificar se o usuário é master admin
    SELECT EXISTS(
        SELECT 1 FROM user_organizations uo
        JOIN organizations o ON uo.organization_id = o.id
        WHERE uo.user_id = auth.uid()
        AND o.is_master = true
        AND uo.role = 'admin'
    ) INTO is_master;
    
    -- Se não for master admin, retornar erro
    IF NOT is_master THEN
        RAISE EXCEPTION 'Acesso negado: apenas master admin pode executar esta função';
    END IF;
    
    -- Executar a query e retornar resultado como JSON
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
    
    -- Se resultado for null, retornar array vazio
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Retornar erro como JSON
        RETURN json_build_object(
            'error', true,
            'message', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- 2. Comentário sobre a função
COMMENT ON FUNCTION execute_sql(text) IS 'Executa queries SQL para debug - apenas master admin';

-- 3. Criar função auxiliar para verificar se usuário é master admin
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM user_organizations uo
        JOIN organizations o ON uo.organization_id = o.id
        WHERE uo.user_id = auth.uid()
        AND o.is_master = true
        AND uo.role = 'admin'
    );
END;
$$;

-- 4. Comentário sobre a função auxiliar
COMMENT ON FUNCTION is_master_admin() IS 'Verifica se o usuário atual é master admin';

-- 5. Testar as funções
SELECT 'Testando função is_master_admin...' as test;
SELECT is_master_admin() as is_master;

SELECT 'Testando função execute_sql...' as test;
SELECT execute_sql('SELECT NOW() as current_time, version() as pg_version') as test_result;

-- 6. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('execute_sql', 'is_master_admin')
ORDER BY routine_name;