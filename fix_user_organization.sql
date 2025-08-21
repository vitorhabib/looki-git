-- Script para corrigir o problema de permissão ao criar faturas
-- Execute este script no Supabase SQL Editor após fazer login na aplicação

-- ⚠️  INSTRUÇÕES IMPORTANTES:
-- 1. PRIMEIRO: Faça login na aplicação web (http://localhost:8081)
-- 2. SEGUNDO: Abra o Supabase Dashboard > SQL Editor
-- 3. TERCEIRO: Cole e execute este script
-- 4. Se auth.uid() retornar null, significa que você não está logado na aplicação

-- IMPORTANTE: Execute este script APENAS quando estiver logado na aplicação
-- para que auth.uid() retorne o ID do usuário correto

-- 1. Verificar o usuário atual
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 2. Verificar organizações existentes
SELECT id, name FROM organizations ORDER BY created_at;

-- 3. Verificar se o usuário já está associado a alguma organização
SELECT 
    uo.*,
    o.name as organization_name 
FROM user_organizations uo 
JOIN organizations o ON uo.organization_id = o.id 
WHERE uo.user_id = auth.uid();

-- 4. SOLUÇÃO: Associar o usuário atual à primeira organização disponível
-- IMPORTANTE: Certifique-se de que auth.uid() não é null antes de executar
DO $$
BEGIN
    -- Verificar se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não está autenticado. Faça login na aplicação primeiro.';
    END IF;
    
    -- Inserir a associação apenas se o usuário estiver autenticado
    INSERT INTO user_organizations (user_id, organization_id, role)
    VALUES (
        auth.uid(),
        '55cea5dc-3453-4dbc-a3df-dc47bb0cc3e6', -- ID da organização "247" (mais recente)
        'owner'
    ) ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Usuário % associado à organização com sucesso!', auth.uid();
END $$;

-- 5. Verificar se a associação foi criada com sucesso
SELECT 
    uo.*,
    o.name as organization_name 
FROM user_organizations uo 
JOIN organizations o ON uo.organization_id = o.id 
WHERE uo.user_id = auth.uid();

-- 6. ALTERNATIVA: Se preferir criar uma nova organização
/*
INSERT INTO organizations (name, description)
VALUES (
    'Minha Empresa',
    'Organização principal para gestão de faturas'
);

-- Associar o usuário à nova organização
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES (
    auth.uid(),
    (SELECT id FROM organizations WHERE name = 'Minha Empresa' ORDER BY created_at DESC LIMIT 1),
    'owner'
);
*/

-- INSTRUÇÕES PASSO A PASSO:
-- 1. Faça login na aplicação web (http://localhost:8081)
-- 2. Abra o Supabase Dashboard > SQL Editor
-- 3. Cole e execute este script completo
-- 4. Verifique se apareceu a mensagem de sucesso
-- 5. Teste a criação de faturas novamente na aplicação

-- SOLUÇÃO DE PROBLEMAS:
-- Se o erro "null value in column user_id" aparecer:
-- - Certifique-se de estar logado na aplicação ANTES de executar o script
-- - O auth.uid() deve retornar um UUID válido, não null