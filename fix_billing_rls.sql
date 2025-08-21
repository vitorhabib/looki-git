-- =====================================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS DE BILLING
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Desabilitar RLS temporariamente para fazer correções
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes das tabelas de billing
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover todas as políticas da tabela clients
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'clients'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON clients';
    END LOOP;
    
    -- Remover todas as políticas da tabela invoices
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'invoices'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON invoices';
    END LOOP;
    
    -- Remover todas as políticas da tabela invoice_items
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'invoice_items'
    LOOP
        EXECUTE 'DROP POLICY "' || policy_record.policyname || '" ON invoice_items';
    END LOOP;
END $$;

-- 3. Reabilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas corrigidas para clients
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 5. Criar políticas corrigidas para invoices
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );



-- 7. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('clients', 'invoices', 'invoice_items')
ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase Dashboard
-- 2. Verifique se não há erros na execução
-- 3. Teste a criação de clientes e faturas novamente
-- =====================================================