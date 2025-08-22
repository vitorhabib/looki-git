-- Corrigir constraint da tabela expenses para permitir status 'overdue'
-- Esta migração remove a constraint antiga e cria uma nova que inclui 'overdue'

-- Primeiro, remover a constraint existente se ela existir
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;

-- Adicionar nova constraint que inclui 'overdue'
ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
  CHECK (status IN ('pending', 'paid', 'overdue'));

-- Comentário para documentar a mudança
COMMENT ON CONSTRAINT expenses_status_check ON expenses IS 
  'Status deve ser pending, paid ou overdue';