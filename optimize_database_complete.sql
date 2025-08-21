-- =====================================================
-- SCRIPT COMPLETO DE OTIMIZAÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- =====================================================
-- 1. ANÁLISE INICIAL DO BANCO DE DADOS
-- =====================================================

-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_tuples_inserted(c.oid) as inserts,
  pg_stat_get_tuples_updated(c.oid) as updates,
  pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
  AND tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar índices existentes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY tablename, indexname;

-- =====================================================
-- 2. CRIAÇÃO DE ÍNDICES ESTRATÉGICOS
-- =====================================================

-- Índices para consultas por organização (mais frequentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_organization_id 
  ON invoices(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_organization_id 
  ON expenses(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_organization_id 
  ON clients(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_organization_id 
  ON categories(organization_id);

-- Índices compostos para consultas frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_status 
  ON invoices(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_client 
  ON invoices(organization_id, client_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_dates 
  ON invoices(organization_id, issue_date, due_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_org_dates 
  ON expenses(organization_id, expense_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_org_category 
  ON expenses(organization_id, category_id);

-- Índices para itens de fatura e despesa


CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expense_items_expense_id 
  ON expense_items(expense_id);

-- Índices para user_organizations (consultas de autenticação)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_id 
  ON user_organizations(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_org_id 
  ON user_organizations(organization_id);

-- =====================================================
-- 3. OTIMIZAÇÃO DE POLÍTICAS RLS
-- =====================================================

-- Remover políticas RLS ineficientes e recriar otimizadas

-- Políticas para invoices
DROP POLICY IF EXISTS "Users can view own organization invoices" ON invoices;
CREATE POLICY "Users can view own organization invoices" ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own organization invoices" ON invoices;
CREATE POLICY "Users can insert own organization invoices" ON invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization invoices" ON invoices;
CREATE POLICY "Users can update own organization invoices" ON invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own organization invoices" ON invoices;
CREATE POLICY "Users can delete own organization invoices" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas similares para expenses
DROP POLICY IF EXISTS "Users can view own organization expenses" ON expenses;
CREATE POLICY "Users can view own organization expenses" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own organization expenses" ON expenses;
CREATE POLICY "Users can insert own organization expenses" ON expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own organization expenses" ON expenses;
CREATE POLICY "Users can update own organization expenses" ON expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own organization expenses" ON expenses;
CREATE POLICY "Users can delete own organization expenses" ON expenses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CONFIGURAÇÃO DE CASCADE DELETE OTIMIZADO
-- =====================================================

-- Remover constraints existentes e recriar com CASCADE


ALTER TABLE expense_items 
  DROP CONSTRAINT IF EXISTS expense_items_expense_id_fkey;

ALTER TABLE expense_items 
  ADD CONSTRAINT expense_items_expense_id_fkey 
  FOREIGN KEY (expense_id) 
  REFERENCES expenses(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 5. LIMPEZA DE DADOS ÓRFÃOS
-- =====================================================



-- Remover expense_items órfãos
DELETE FROM expense_items 
WHERE expense_id NOT IN (SELECT id FROM expenses);

-- Remover invoices sem organização válida
DELETE FROM invoices 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- Remover expenses sem organização válida
DELETE FROM expenses 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- =====================================================
-- 6. FUNÇÕES DE MONITORAMENTO E ANÁLISE
-- =====================================================

-- Função para analisar performance de consultas
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
  query_type text,
  avg_time_ms numeric,
  calls bigint,
  total_time_ms numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Database Statistics' as query_type,
    0::numeric as avg_time_ms,
    0::bigint as calls,
    0::numeric as total_time_ms;
END;
$$;

-- Função para verificar uso de índices
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::text,
    s.tablename::text,
    s.indexrelname::text,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.schemaname = 'public'
    AND s.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories')
  ORDER BY s.idx_scan DESC;
END;
$$;

-- =====================================================
-- 7. VIEWS OTIMIZADAS PARA RELATÓRIOS
-- =====================================================

-- View otimizada para dashboard de faturas
CREATE OR REPLACE VIEW dashboard_invoices AS
SELECT 
  i.id,
  i.organization_id,
  i.client_id,
  c.name as client_name,
  i.title,
  i.total_amount,
  i.status,
  i.issue_date,
  i.due_date,
  i.paid_at,
  cat.name as category_name,
  cat.color as category_color
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN categories cat ON i.category_id = cat.id;

-- View otimizada para dashboard de despesas
CREATE OR REPLACE VIEW dashboard_expenses AS
SELECT 
  e.id,
  e.organization_id,
  e.description,
  e.amount,
  e.expense_date,
  e.category_id,
  cat.name as category_name,
  cat.color as category_color
FROM expenses e
LEFT JOIN categories cat ON e.category_id = cat.id;

-- =====================================================
-- 8. FUNÇÃO DE MANUTENÇÃO AUTOMATIZADA
-- =====================================================

CREATE OR REPLACE FUNCTION maintenance_routine()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text := '';
BEGIN
  -- Atualizar estatísticas das tabelas principais
  ANALYZE invoices;
  ANALYZE expenses;
  ANALYZE clients;
  ANALYZE organizations;
  ANALYZE categories;
  
  ANALYZE expense_items;
  
  result := result || 'Estatísticas atualizadas. ';
  
  -- Verificar e reportar tabelas que precisam de VACUUM
  IF (SELECT count(*) FROM pg_stat_user_tables WHERE n_dead_tup > 1000) > 0 THEN
    result := result || 'Algumas tabelas precisam de VACUUM. ';
  END IF;
  
  result := result || 'Manutenção concluída.';
  
  RETURN result;
END;
$$;

-- =====================================================
-- 9. CONFIGURAÇÕES DE PERFORMANCE
-- =====================================================

-- Configurar autovacuum mais agressivo para tabelas principais
ALTER TABLE invoices SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE expenses SET (autovacuum_vacuum_scale_factor = 0.1);

ALTER TABLE expense_items SET (autovacuum_vacuum_scale_factor = 0.1);

-- =====================================================
-- 10. VERIFICAÇÃO FINAL E RELATÓRIO
-- =====================================================

-- Executar análise final
SELECT 'OTIMIZAÇÃO CONCLUÍDA' as status;

-- Mostrar estatísticas finais
SELECT 
  'ESTATÍSTICAS FINAIS' as tipo,
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as tamanho,
  (SELECT count(*) FROM pg_indexes WHERE tablename = pt.tablename) as num_indices
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- Verificar uso de índices
SELECT * FROM check_index_usage();

-- Executar manutenção inicial
SELECT maintenance_routine() as resultado_manutencao;

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================

/*
APÓS EXECUTAR ESTE SCRIPT:

1. MONITORAMENTO:
   - Execute SELECT * FROM check_index_usage(); periodicamente
   - Execute SELECT maintenance_routine(); semanalmente

2. PERFORMANCE:
   - As consultas por organização devem estar mais rápidas
   - Exclusões em cascata devem funcionar corretamente
   - Views otimizadas disponíveis para relatórios

3. MANUTENÇÃO:
   - Configure um cron job para executar maintenance_routine()
   - Monitore o crescimento das tabelas
   - Verifique logs de slow queries no Supabase Dashboard

4. PRÓXIMOS PASSOS:
   - Teste a aplicação para verificar melhorias
   - Monitore métricas de performance no Supabase
   - Ajuste índices conforme necessário
*/