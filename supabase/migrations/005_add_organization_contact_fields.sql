-- Migração para adicionar campos de contato à tabela organizations
-- Esta migração adiciona os campos email, phone, address e website

-- Adicionar novos campos à tabela organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Comentários para documentar os novos campos
COMMENT ON COLUMN organizations.email IS 'Email de contato da organização';
COMMENT ON COLUMN organizations.phone IS 'Telefone de contato da organização';
COMMENT ON COLUMN organizations.address IS 'Endereço completo da organização';
COMMENT ON COLUMN organizations.website IS 'Website da organização';

-- Criar índice para email (caso seja usado para busca)
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);