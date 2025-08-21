-- Script para corrigir a estrutura da tabela organizations
-- Execute este script no Supabase SQL Editor

-- Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Adicionar colunas que podem estar faltando
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);

-- Comentários para documentação
COMMENT ON COLUMN organizations.description IS 'Descrição da organização';
COMMENT ON COLUMN organizations.created_by IS 'Usuário que criou a organização';
COMMENT ON COLUMN organizations.email IS 'Email de contato da organização';
COMMENT ON COLUMN organizations.phone IS 'Telefone de contato da organização';
COMMENT ON COLUMN organizations.address IS 'Endereço completo da organização';
COMMENT ON COLUMN organizations.website IS 'Website da organização';

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;