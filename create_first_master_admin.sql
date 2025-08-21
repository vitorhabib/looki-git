-- =====================================================
-- CRIAR PRIMEIRO USUÁRIO MASTER ADMIN
-- Execute APÓS executar o master_admin_production_setup.sql
-- =====================================================

-- PASSO 1: Verificar usuários existentes no auth.users
-- Execute esta query para ver os usuários disponíveis:
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- PASSO 2: Criar o primeiro Master Admin
-- IMPORTANTE: Substitua os valores abaixo pelos dados reais
-- Copie o ID do usuário da query acima

-- EXEMPLO (AJUSTE OS VALORES):
/*
SELECT promote_to_master_admin(
  '00000000-0000-0000-0000-000000000000', -- Substitua pelo ID real do usuário
  'seu-email@exemplo.com',                -- Substitua pelo email real
  'Seu Nome Completo'                     -- Substitua pelo nome real
);
*/

-- PASSO 3: Verificar se o Master Admin foi criado
SELECT 
  ma.id,
  ma.user_id,
  ma.email,
  ma.full_name,
  ma.is_active,
  ma.created_at,
  au.email as auth_email
FROM master_admins ma
JOIN auth.users au ON ma.user_id = au.id
ORDER BY ma.created_at DESC;

-- PASSO 4: Testar a função is_master_admin
-- Substitua pelo ID do usuário que você promoveu
/*
SELECT is_master_admin('00000000-0000-0000-0000-000000000000') as is_master;
*/

-- PASSO 5: Verificar estatísticas do SaaS
-- Esta query só funcionará se você for master admin
SELECT * FROM saas_stats;

-- PASSO 6: Verificar políticas RLS
-- Testar se as políticas estão funcionando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('master_admins', 'organizations', 'user_organizations')
ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUÇÕES DETALHADAS:
-- =====================================================
--
-- 1. Primeiro, execute o script master_admin_production_setup.sql
-- 2. Faça login na sua aplicação para garantir que seu usuário existe em auth.users
-- 3. Execute o PASSO 1 para ver seu user_id
-- 4. Copie seu user_id e ajuste o PASSO 2 com seus dados reais
-- 5. Execute o PASSO 2 (descomente e ajuste os valores)
-- 6. Execute os PASSOS 3, 4 e 5 para verificar se tudo funcionou
--
-- EXEMPLO COMPLETO:
-- Supondo que seu user_id seja: 12345678-1234-1234-1234-123456789012
-- E seu email seja: admin@meusite.com
--
-- SELECT promote_to_master_admin(
--   '12345678-1234-1234-1234-123456789012',
--   'admin@meusite.com',
--   'Administrador Principal'
-- );
--
-- =====================================================

-- Mensagem de status
SELECT 'Script de criação de Master Admin carregado. Siga as instruções acima.' as status;