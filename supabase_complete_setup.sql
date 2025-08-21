-- =====================================================
-- SCRIPT COMPLETO PARA SETUP DO SUPABASE (VERSÃO SIMPLIFICADA)
-- Execute este script manualmente no Supabase SQL Editor
-- Inclui: Organizações + Tabelas de Cobranças + Políticas RLS
-- =====================================================

-- =====================================================
-- PARTE 1: ESTRUTURA DE ORGANIZAÇÕES
-- =====================================================

-- 1. Criar tabela de organizações (versão simplificada)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de relacionamento usuário-organização
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 3. Índices para performance das organizações
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- 4. Habilitar RLS nas tabelas de organizações
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para organizações
-- Usuários podem ver organizações das quais fazem parte
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem criar organizações
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

-- Usuários podem atualizar organizações das quais fazem parte
CREATE POLICY "Users can update their organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- 6. Políticas para user_organizations
-- Usuários podem ver seus próprios relacionamentos
CREATE POLICY "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Usuários podem inserir relacionamentos para si mesmos
CREATE POLICY "Users can insert their organization memberships" ON user_organizations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Usuários podem atualizar seus próprios relacionamentos
CREATE POLICY "Users can update their organization memberships" ON user_organizations
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Usuários podem deletar seus próprios relacionamentos
CREATE POLICY "Users can delete their organization memberships" ON user_organizations
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- 7. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_organizations_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_organizations_updated_at_column();

-- =====================================================
-- PARTE 2: TABELAS DE COBRANÇAS
-- =====================================================

-- 1. Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  document VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Brasil',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- =====================================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para a tabela clients
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Índices para a tabela invoices
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);



-- =====================================================
-- PARTE 4: TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

-- Função para atualizar updated_at (reutilizando se já existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para as tabelas de cobrança
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- =====================================================
-- PARTE 5: FUNÇÃO PARA CALCULAR TOTAL DA FATURA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;
    
    UPDATE invoices
    SET 
        subtotal = total,
        total_amount = total + tax_amount,
        updated_at = NOW()
    WHERE id = invoice_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 6: HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PARTE 7: POLÍTICAS DE SEGURANÇA PARA CLIENTS
-- =====================================================

-- Usuários podem ver apenas clientes da sua organização
CREATE POLICY "Users can view own organization clients" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem inserir clientes apenas para organizações das quais fazem parte
CREATE POLICY "Users can insert own organization clients" ON clients
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem atualizar apenas clientes da sua organização
CREATE POLICY "Users can update own organization clients" ON clients
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem deletar apenas clientes da sua organização
CREATE POLICY "Users can delete own organization clients" ON clients
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- =====================================================
-- PARTE 8: POLÍTICAS DE SEGURANÇA PARA INVOICES
-- =====================================================

-- Usuários podem ver apenas faturas da sua organização
CREATE POLICY "Users can view own organization invoices" ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem inserir faturas apenas para organizações das quais fazem parte
CREATE POLICY "Users can insert own organization invoices" ON invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem atualizar apenas faturas da sua organização
CREATE POLICY "Users can update own organization invoices" ON invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Usuários podem deletar apenas faturas da sua organização
CREATE POLICY "Users can delete own organization invoices" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id::text = auth.uid()::text
    )
  );



-- =====================================================
-- PARTE 10: COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON TABLE organizations IS 'Tabela de organizações/empresas';
COMMENT ON TABLE user_organizations IS 'Relacionamento entre usuários e organizações';
COMMENT ON TABLE clients IS 'Tabela de clientes associados às organizações';
COMMENT ON TABLE invoices IS 'Tabela de faturas associadas às organizações';


COMMENT ON COLUMN organizations.name IS 'Nome da organização';
COMMENT ON COLUMN user_organizations.role IS 'Papel do usuário na organização: owner, admin, member';
COMMENT ON COLUMN clients.organization_id IS 'ID da organização à qual o cliente pertence';
COMMENT ON COLUMN invoices.organization_id IS 'ID da organização à qual a fatura pertence';
COMMENT ON COLUMN invoices.client_id IS 'ID do cliente para quem a fatura foi emitida';


-- =====================================================
-- PARTE 11: INSERIR ORGANIZAÇÃO PADRÃO (EXECUTE APÓS LOGIN)
-- =====================================================
-- Execute este bloco APENAS após fazer login no sistema
-- Substitua 'SEU_USER_ID' pelo ID do seu usuário

/*
-- 1. Criar uma organização padrão
INSERT INTO organizations (name, description)
VALUES (
  'Minha Empresa',
  'Organização padrão para testes'
) ON CONFLICT DO NOTHING;

-- 2. Associar o usuário atual à organização como owner
-- IMPORTANTE: Execute este comando apenas quando estiver logado
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES (
  auth.uid(),
  (SELECT id FROM organizations WHERE name = 'Minha Empresa' LIMIT 1),
  'owner'
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 3. Exemplo de cliente (opcional)
INSERT INTO clients (name, email, phone, document, address, city, state, zip_code, organization_id)
VALUES (
  'João Silva',
  'joao.silva@email.com',
  '(11) 99999-9999',
  '123.456.789-00',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  (SELECT id FROM organizations WHERE name = 'Minha Empresa' LIMIT 1)
) ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- FIM DO SCRIPT COMPLETO
-- =====================================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('organizations', 'user_organizations', 'clients', 'invoices');

-- Para verificar as políticas RLS:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('organizations', 'user_organizations', 'clients', 'invoices');