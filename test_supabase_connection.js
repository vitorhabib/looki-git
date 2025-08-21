// Teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjqhgvnzjwkhsrebcjvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcWhndm56andraHNyZWJjanZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MTEyOTMsImV4cCI6MjA2Njk4NzI5M30.3lQZZ1l0umn1PWtS7EcoFvkZBgB9pZcqYZg92LhhXhw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Testando conexão com Supabase...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('organizations').select('count', { count: 'exact' });
    console.log('📊 Teste de conexão:', { data, error });
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return;
    }
    
    console.log('✅ Conexão com Supabase funcionando!');
    
    // Verificar se as tabelas existem
    const tables = ['organizations', 'users', 'user_organizations', 'clients', 'invoices'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact' });
        console.log(`📋 Tabela ${table}:`, error ? '❌ Não existe' : `✅ Existe (${data.length} registros)`);
      } catch (err) {
        console.log(`📋 Tabela ${table}: ❌ Erro - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection();