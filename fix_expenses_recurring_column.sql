-- Script para adicionar coluna is_recurring na tabela expenses
-- Execute este script no painel do Supabase (SQL Editor)

-- Adicionar coluna is_recurring se não existir
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Adicionar outras colunas de recorrência se não existirem
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS parent_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS next_recurring_date DATE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS idx_expenses_next_recurring_date ON expenses(next_recurring_date);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON expenses(parent_expense_id);

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('is_recurring', 'recurring_frequency', 'recurring_start_date', 'recurring_end_date', 'parent_expense_id', 'next_recurring_date')
ORDER BY column_name;