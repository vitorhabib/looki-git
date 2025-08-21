-- Script para criar tabelas de serviços no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de serviços recorrentes
CREATE TABLE IF NOT EXISTS recurring_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- valor em centavos
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_billing_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços pontuais
CREATE TABLE IF NOT EXISTS one_time_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- valor em centavos
  execution_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_recurring_services_client_id ON recurring_services(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_organization_id ON recurring_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_status ON recurring_services(status);
CREATE INDEX IF NOT EXISTS idx_recurring_services_next_billing_date ON recurring_services(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_one_time_services_client_id ON one_time_services(client_id);
CREATE INDEX IF NOT EXISTS idx_one_time_services_organization_id ON one_time_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_one_time_services_status ON one_time_services(status);
CREATE INDEX IF NOT EXISTS idx_one_time_services_execution_date ON one_time_services(execution_date);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recurring_services_updated_at
    BEFORE UPDATE ON recurring_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_one_time_services_updated_at
    BEFORE UPDATE ON one_time_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular próxima data de cobrança
CREATE OR REPLACE FUNCTION calculate_next_billing_date(start_date DATE, frequency VARCHAR)
RETURNS DATE AS $$
BEGIN
    CASE frequency
        WHEN 'weekly' THEN
            RETURN start_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            RETURN start_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN start_date + INTERVAL '3 months';
        WHEN 'yearly' THEN
            RETURN start_date + INTERVAL '1 year';
        ELSE
            RETURN start_date + INTERVAL '1 month';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para definir next_billing_date automaticamente
CREATE OR REPLACE FUNCTION set_next_billing_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.next_billing_date IS NULL THEN
        NEW.next_billing_date = calculate_next_billing_date(NEW.start_date, NEW.frequency);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recurring_services_next_billing_date
    BEFORE INSERT OR UPDATE ON recurring_services
    FOR EACH ROW
    EXECUTE FUNCTION set_next_billing_date();

-- Habilitar RLS nas tabelas de serviços
ALTER TABLE recurring_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para recurring_services

-- Política para SELECT: usuários podem ver serviços recorrentes da sua organização
CREATE POLICY "Users can view recurring services from their organization" ON recurring_services
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para INSERT: usuários podem criar serviços recorrentes na sua organização
CREATE POLICY "Users can create recurring services in their organization" ON recurring_services
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para UPDATE: usuários podem atualizar serviços recorrentes da sua organização
CREATE POLICY "Users can update recurring services from their organization" ON recurring_services
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para DELETE: usuários podem deletar serviços recorrentes da sua organização
CREATE POLICY "Users can delete recurring services from their organization" ON recurring_services
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para one_time_services

-- Política para SELECT: usuários podem ver serviços pontuais da sua organização
CREATE POLICY "Users can view one time services from their organization" ON one_time_services
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para INSERT: usuários podem criar serviços pontuais na sua organização
CREATE POLICY "Users can create one time services in their organization" ON one_time_services
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para UPDATE: usuários podem atualizar serviços pontuais da sua organização
CREATE POLICY "Users can update one time services from their organization" ON one_time_services
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Política para DELETE: usuários podem deletar serviços pontuais da sua organização
CREATE POLICY "Users can delete one time services from their organization" ON one_time_services
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para Master Admin (acesso total)

-- Recurring Services - Master Admin
CREATE POLICY "Master admin can manage all recurring services" ON recurring_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'master_admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'master_admin'
        )
    );

-- One Time Services - Master Admin
CREATE POLICY "Master admin can manage all one time services" ON one_time_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'master_admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'master_admin'
        )
    );

-- Comentários para documentação
COMMENT ON TABLE recurring_services IS 'Tabela para armazenar serviços recorrentes dos clientes';
COMMENT ON TABLE one_time_services IS 'Tabela para armazenar serviços pontuais dos clientes';
COMMENT ON COLUMN recurring_services.amount IS 'Valor do serviço em centavos';
COMMENT ON COLUMN one_time_services.amount IS 'Valor do serviço em centavos';
COMMENT ON COLUMN recurring_services.frequency IS 'Frequência de cobrança: weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN recurring_services.status IS 'Status do serviço: active, paused, cancelled';
COMMENT ON COLUMN one_time_services.status IS 'Status do serviço: pending, completed, cancelled';

-- Inserir dados de exemplo (opcional)
-- INSERT INTO recurring_services (client_id, organization_id, name, description, amount, frequency, start_date) 
-- VALUES (
--   (SELECT id FROM clients LIMIT 1),
--   (SELECT id FROM organizations LIMIT 1),
--   'Manutenção Mensal do Site',
--   'Serviço de manutenção e atualização mensal do website',
--   15000, -- R$ 150,00 em centavos
--   'monthly',
--   CURRENT_DATE
-- );

SELECT 'Tabelas de serviços criadas com sucesso!' as resultado;