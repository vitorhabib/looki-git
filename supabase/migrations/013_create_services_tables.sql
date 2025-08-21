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