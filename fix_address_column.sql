-- Script consolidado para corrigir a estrutura da tabela organizations
-- Execute este script no Supabase Dashboard > SQL Editor
-- Baseado nas migrações 004 e 005 do projeto

-- 1. Verificar se a tabela organizations existe
SELECT 'Verificando tabela organizations...' as status;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'organizations';

-- 2. Verificar colunas atuais da tabela organizations
SELECT 'Colunas atuais da tabela organizations:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- 3. Criar tabela organizations se não existir (estrutura mínima)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1. Adicionar colunas básicas se não existirem
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Adicionar campos de contato se não existirem (baseado na migração 005)
SELECT 'Adicionando campos de contato...' as status;
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- 5. Verificar se todas as colunas foram adicionadas
SELECT 'Verificando colunas após adição...' as status;

-- 6. Criar função para trigger de updated_at
CREATE OR REPLACE FUNCTION update_organizations_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW 
    EXECUTE FUNCTION update_organizations_updated_at_column();

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);

-- 9. Adicionar comentários para documentação
COMMENT ON TABLE organizations IS 'Tabela de organizações/empresas';
COMMENT ON COLUMN organizations.name IS 'Nome da organização';
COMMENT ON COLUMN organizations.description IS 'Descrição da organização';
COMMENT ON COLUMN organizations.created_by IS 'Usuário que criou a organização';
COMMENT ON COLUMN organizations.email IS 'Email de contato da organização';
COMMENT ON COLUMN organizations.phone IS 'Telefone de contato da organização';
COMMENT ON COLUMN organizations.address IS 'Endereço completo da organização';
COMMENT ON COLUMN organizations.website IS 'Website da organização';

-- 10. Habilitar RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 11. Verificar se as colunas foram criadas corretamente
SELECT 'Verificação final - Estrutura da tabela organizations:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- 12. Testar uma query SELECT com todas as colunas
SELECT 'Teste de SELECT com todas as colunas:' as status;
SELECT id, name, description, email, phone, address, website, created_by, created_at, updated_at
FROM organizations
LIMIT 3;

-- 13. Verificar se o trigger foi criado
SELECT 'Verificando trigger updated_at:' as status;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'organizations'
AND trigger_name = 'update_organizations_updated_at';

-- 14. Resultado final
SELECT '✅ Estrutura da tabela organizations corrigida com sucesso!' as resultado;
SELECT 'Colunas adicionadas: email, phone, address, website, updated_at' as detalhes;
SELECT 'Trigger para updated_at criado automaticamente' as trigger_info;