-- =====================================================
-- SCRIPT DE MONITORAMENTO DE PERFORMANCE DO BANCO
-- Execute periodicamente para acompanhar a saúde do banco
-- =====================================================

-- =====================================================
-- 1. ESTATÍSTICAS GERAIS DO BANCO
-- =====================================================

SELECT 
  'ESTATÍSTICAS GERAIS' as categoria,
  'Tamanho Total do Banco' as metrica,
  pg_size_pretty(pg_database_size(current_database())) as valor
UNION ALL
SELECT 
  'ESTATÍSTICAS GERAIS',
  'Número de Conexões Ativas',
  count(*)::text
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
  'ESTATÍSTICAS GERAIS',
  'Número de Conexões Idle',
  count(*)::text
FROM pg_stat_activity 
WHERE state = 'idle';

-- =====================================================
-- 2. PERFORMANCE DAS TABELAS PRINCIPAIS
-- =====================================================

SELECT 
  'PERFORMANCE TABELAS' as categoria,
  pt.schemaname,
  pt.tablename,
  pg_size_pretty(pg_total_relation_size(pt.schemaname||'.'||pt.tablename)) as tamanho,
  pt.seq_scan as "Varreduras Sequenciais",
  pt.seq_tup_read as "Tuplas Lidas (Seq)",
  pt.idx_scan as "Varreduras por Índice",
  pt.idx_tup_fetch as "Tuplas Buscadas (Idx)",
  pt.n_tup_ins as "Inserções",
  pt.n_tup_upd as "Atualizações",
  pt.n_tup_del as "Exclusões",
  pt.n_dead_tup as "Tuplas Mortas",
  CASE 
    WHEN pt.seq_scan + pt.idx_scan > 0 
    THEN round((pt.idx_scan::numeric / (pt.seq_scan + pt.idx_scan)) * 100, 2)
    ELSE 0 
  END as "% Uso Índices"
FROM pg_stat_user_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY pg_total_relation_size(pt.schemaname||'.'||pt.tablename) DESC;

-- =====================================================
-- 3. ANÁLISE DE ÍNDICES
-- =====================================================

SELECT 
  'ANÁLISE ÍNDICES' as categoria,
  psi.schemaname,
  psi.tablename,
  psi.indexrelname as "Nome do Índice",
  psi.idx_scan as "Usos do Índice",
  psi.idx_tup_read as "Tuplas Lidas",
  psi.idx_tup_fetch as "Tuplas Buscadas",
  pg_size_pretty(pg_relation_size(psi.indexrelid)) as "Tamanho Índice",
  CASE 
    WHEN psi.idx_scan = 0 THEN 'NUNCA USADO'
    WHEN psi.idx_scan < 100 THEN 'POUCO USADO'
    WHEN psi.idx_scan < 1000 THEN 'USO MODERADO'
    ELSE 'MUITO USADO'
  END as "Status de Uso"
FROM pg_stat_user_indexes psi
WHERE psi.schemaname = 'public'
  AND psi.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY psi.idx_scan DESC;

-- =====================================================
-- 4. IDENTIFICAR ÍNDICES NÃO UTILIZADOS
-- =====================================================

SELECT 
  'ÍNDICES NÃO UTILIZADOS' as categoria,
  psi.schemaname,
  psi.tablename,
  psi.indexrelname as "Índice Não Usado",
  pg_size_pretty(pg_relation_size(psi.indexrelid)) as "Espaço Desperdiçado",
  'DROP INDEX ' || psi.indexrelname || ';' as "Comando para Remover"
FROM pg_stat_user_indexes psi
WHERE psi.schemaname = 'public'
  AND psi.idx_scan = 0
  AND psi.indexrelname NOT LIKE '%_pkey'
  AND psi.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY pg_relation_size(psi.indexrelid) DESC;

-- =====================================================
-- 5. CONSULTAS MAIS LENTAS (se disponível)
-- =====================================================

-- Verificar se pg_stat_statements está disponível
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
    THEN 'pg_stat_statements DISPONÍVEL'
    ELSE 'pg_stat_statements NÃO DISPONÍVEL - Instale para análise de consultas'
  END as "Status pg_stat_statements";

-- =====================================================
-- 6. ANÁLISE DE BLOAT (INCHAÇO) DAS TABELAS
-- =====================================================

SELECT 
  'ANÁLISE BLOAT' as categoria,
  pt.schemaname,
  pt.tablename,
  pg_size_pretty(pg_total_relation_size(pt.schemaname||'.'||pt.tablename)) as "Tamanho Total",
  pt.n_dead_tup as "Tuplas Mortas",
  pt.n_live_tup as "Tuplas Vivas",
  CASE 
    WHEN pt.n_live_tup > 0 
    THEN round((pt.n_dead_tup::numeric / pt.n_live_tup) * 100, 2)
    ELSE 0 
  END as "% Bloat",
  pt.last_vacuum,
  pt.last_autovacuum,
  CASE 
    WHEN pt.n_dead_tup > pt.n_live_tup * 0.2 THEN 'VACUUM URGENTE'
    WHEN pt.n_dead_tup > pt.n_live_tup * 0.1 THEN 'VACUUM RECOMENDADO'
    ELSE 'OK'
  END as "Recomendação"
FROM pg_stat_user_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY (pt.n_dead_tup::numeric / GREATEST(pt.n_live_tup, 1)) DESC;

-- =====================================================
-- 7. VERIFICAÇÃO DE LOCKS E BLOQUEIOS
-- =====================================================

SELECT 
  'LOCKS ATIVOS' as categoria,
  l.locktype,
  l.database,
  l.relation::regclass as tabela,
  l.mode,
  l.granted,
  a.query,
  a.state,
  a.query_start,
  now() - a.query_start as duracao
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.granted = false
   OR (l.mode IN ('AccessExclusiveLock', 'ExclusiveLock') AND l.granted = true)
ORDER BY a.query_start;

-- =====================================================
-- 8. MÉTRICAS DE CACHE E I/O
-- =====================================================

SELECT 
  'CACHE E I/O' as categoria,
  psut.schemaname,
  psut.tablename,
  psut.heap_blks_read as "Blocos Lidos do Disco",
  psut.heap_blks_hit as "Blocos do Cache",
  CASE 
    WHEN psut.heap_blks_read + psut.heap_blks_hit > 0 
    THEN round((psut.heap_blks_hit::numeric / (psut.heap_blks_read + psut.heap_blks_hit)) * 100, 2)
    ELSE 0 
  END as "% Cache Hit Ratio",
  psut.idx_blks_read as "Índice Blocos Disco",
  psut.idx_blks_hit as "Índice Blocos Cache",
  CASE 
    WHEN psut.idx_blks_read + psut.idx_blks_hit > 0 
    THEN round((psut.idx_blks_hit::numeric / (psut.idx_blks_read + psut.idx_blks_hit)) * 100, 2)
    ELSE 0 
  END as "% Índice Cache Hit"
FROM pg_statio_user_tables psut
WHERE psut.schemaname = 'public'
  AND psut.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
ORDER BY psut.heap_blks_read DESC;

-- =====================================================
-- 9. RECOMENDAÇÕES AUTOMÁTICAS
-- =====================================================

WITH table_stats AS (
  SELECT 
    pt.tablename,
    pt.n_dead_tup,
    pt.n_live_tup,
    pt.seq_scan,
    pt.idx_scan,
    pg_total_relation_size('public.'||pt.tablename) as size_bytes
  FROM pg_stat_user_tables pt
  WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
)
SELECT 
  'RECOMENDAÇÕES' as categoria,
  ts.tablename,
  CASE 
    WHEN ts.n_dead_tup > 1000 AND (ts.n_dead_tup::numeric / GREATEST(ts.n_live_tup, 1)) > 0.1 
    THEN 'EXECUTAR: VACUUM ' || ts.tablename || ';'
    WHEN ts.seq_scan > ts.idx_scan * 2 AND ts.seq_scan > 100
    THEN 'CONSIDERAR: Criar índices para ' || ts.tablename
    WHEN ts.size_bytes > 100 * 1024 * 1024 AND ts.idx_scan = 0
    THEN 'INVESTIGAR: Tabela grande sem uso de índices - ' || ts.tablename
    ELSE 'Tabela em bom estado'
  END as recomendacao,
  pg_size_pretty(ts.size_bytes) as tamanho
FROM table_stats ts
ORDER BY ts.size_bytes DESC;

-- =====================================================
-- 10. RESUMO EXECUTIVO
-- =====================================================

WITH resumo AS (
  SELECT 
    count(*) as total_tabelas,
    sum(pg_total_relation_size('public.'||pt.tablename)) as tamanho_total,
    sum(pt.n_dead_tup) as total_tuplas_mortas,
    sum(pt.n_live_tup) as total_tuplas_vivas,
    avg(CASE WHEN pt.seq_scan + pt.idx_scan > 0 
        THEN (pt.idx_scan::numeric / (pt.seq_scan + pt.idx_scan)) * 100 
        ELSE 0 END) as media_uso_indices
  FROM pg_stat_user_tables pt
  WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('invoices', 'expenses', 'clients', 'organizations', 'categories', 'expense_items')
)
SELECT 
  'RESUMO EXECUTIVO' as categoria,
  'Total de Tabelas Monitoradas: ' || total_tabelas as estatistica
FROM resumo
UNION ALL
SELECT 
  'RESUMO EXECUTIVO',
  'Tamanho Total: ' || pg_size_pretty(tamanho_total)
FROM resumo
UNION ALL
SELECT 
  'RESUMO EXECUTIVO',
  'Total Tuplas Vivas: ' || total_tuplas_vivas
FROM resumo
UNION ALL
SELECT 
  'RESUMO EXECUTIVO',
  'Total Tuplas Mortas: ' || total_tuplas_mortas
FROM resumo
UNION ALL
SELECT 
  'RESUMO EXECUTIVO',
  'Média Uso de Índices: ' || round(media_uso_indices, 2) || '%'
FROM resumo
UNION ALL
SELECT 
  'RESUMO EXECUTIVO',
  CASE 
    WHEN (SELECT sum(pt.n_dead_tup) FROM pg_stat_user_tables pt WHERE pt.schemaname = 'public') > 5000
    THEN '⚠️  AÇÃO NECESSÁRIA: Execute VACUUM nas tabelas'
    WHEN (SELECT avg(CASE WHEN pt.seq_scan + pt.idx_scan > 0 THEN (pt.idx_scan::numeric / (pt.seq_scan + pt.idx_scan)) * 100 ELSE 0 END) 
          FROM pg_stat_user_tables pt WHERE pt.schemaname = 'public') < 80
    THEN '⚠️  ATENÇÃO: Baixo uso de índices detectado'
    ELSE '✅ Banco de dados em bom estado'
  END;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
COMO USAR ESTE SCRIPT:

1. FREQUÊNCIA DE EXECUÇÃO:
   - Execute diariamente durante desenvolvimento
   - Execute semanalmente em produção
   - Execute após grandes operações de dados

2. INTERPRETAÇÃO DOS RESULTADOS:
   - % Uso Índices > 80%: Bom
   - % Cache Hit Ratio > 95%: Excelente
   - Tuplas Mortas < 10% das vivas: Aceitável

3. AÇÕES BASEADAS NOS RESULTADOS:
   - Se "PRECISA VACUUM": Execute VACUUM na tabela
   - Se "Índices não utilizados": Considere remover
   - Se "Baixo uso de índices": Analise consultas

4. ALERTAS IMPORTANTES:
   - Locks de longa duração podem indicar problemas
   - Cache hit ratio baixo indica necessidade de mais RAM
   - Muitas tuplas mortas indicam necessidade de VACUUM

5. PRÓXIMOS PASSOS:
   - Configure monitoramento automático
   - Implemente alertas baseados nas métricas
   - Documente padrões de performance normais
*/