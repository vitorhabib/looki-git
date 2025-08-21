-- =====================================================
-- SCRIPT PARA DESABILITAR RLS TEMPORARIAMENTE
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- Desabilitar RLS completamente para permitir criação de organizações
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('organizations', 'user_organizations')
AND schemaname = 'public';

-- =====================================================
-- IMPORTANTE: 
-- 1. Execute este script primeiro para permitir criação de organizações
-- 2. Após criar as organizações necessárias, execute o script de correção RLS
-- 3. Este é um fix temporário para resolver o problema imediato
-- =====================================================