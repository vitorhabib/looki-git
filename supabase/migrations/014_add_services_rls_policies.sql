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