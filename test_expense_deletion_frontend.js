// Script para testar exclusão de despesas no console do navegador
// Execute este código no console do navegador (F12) enquanto estiver na página de despesas

// 1. Verificar se o Supabase está conectado
console.log('=== TESTE DE EXCLUSÃO DE DESPESAS ===');
console.log('1. Verificando conexão com Supabase...');

// Verificar se existe o cliente Supabase
if (typeof window.supabase !== 'undefined') {
  console.log('✅ Cliente Supabase encontrado');
} else {
  console.log('❌ Cliente Supabase não encontrado');
  console.log('Tentando acessar via módulos...');
}

// 2. Listar despesas existentes
async function listExpenses() {
  try {
    console.log('2. Listando despesas existentes...');
    
    // Tentar diferentes formas de acessar o Supabase
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
    } else {
      console.log('❌ Não foi possível encontrar o cliente Supabase');
      return;
    }
    
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao listar despesas:', error);
    } else {
      console.log('✅ Despesas encontradas:', expenses);
      return expenses;
    }
  } catch (err) {
    console.error('❌ Erro na função listExpenses:', err);
  }
}

// 3. Testar exclusão de uma despesa específica
async function testDeleteExpense(expenseId) {
  try {
    console.log(`3. Testando exclusão da despesa ${expenseId}...`);
    
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
    } else {
      console.log('❌ Não foi possível encontrar o cliente Supabase');
      return;
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    
    if (error) {
      console.error('❌ Erro ao excluir despesa:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Despesa excluída com sucesso:', data);
    }
  } catch (err) {
    console.error('❌ Erro na função testDeleteExpense:', err);
  }
}

// 4. Verificar políticas RLS
async function checkRLSPolicies() {
  try {
    console.log('4. Verificando políticas RLS...');
    
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
    } else {
      console.log('❌ Não foi possível encontrar o cliente Supabase');
      return;
    }
    
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual
        FROM pg_policies 
        WHERE tablename = 'expenses' AND cmd = 'DELETE';
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar políticas RLS:', error);
    } else {
      console.log('✅ Políticas RLS para DELETE:', data);
    }
  } catch (err) {
    console.error('❌ Erro na função checkRLSPolicies:', err);
  }
}

// 5. Verificar usuário atual e organizações
async function checkUserAndOrganizations() {
  try {
    console.log('5. Verificando usuário e organizações...');
    
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
    } else {
      console.log('❌ Não foi possível encontrar o cliente Supabase');
      return;
    }
    
    // Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
    } else {
      console.log('✅ Usuário atual:', user?.id);
      
      // Verificar organizações do usuário
      const { data: orgs, error: orgError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', user?.id);
      
      if (orgError) {
        console.error('❌ Erro ao obter organizações:', orgError);
      } else {
        console.log('✅ Organizações do usuário:', orgs);
      }
    }
  } catch (err) {
    console.error('❌ Erro na função checkUserAndOrganizations:', err);
  }
}

// 6. Executar todos os testes
async function runAllTests() {
  console.log('=== INICIANDO TESTES COMPLETOS ===');
  
  await checkUserAndOrganizations();
  await checkRLSPolicies();
  const expenses = await listExpenses();
  
  if (expenses && expenses.length > 0) {
    console.log('\n=== TESTE DE EXCLUSÃO ===');
    console.log('Para testar a exclusão, execute:');
    console.log(`testDeleteExpense('${expenses[0].id}')`);
    console.log('\nOu escolha outro ID da lista acima.');
  }
  
  console.log('\n=== TESTES CONCLUÍDOS ===');
}

// Executar automaticamente
runAllTests();

// Instruções para o usuário
console.log(`
=== INSTRUÇÕES ===
1. Este script foi executado automaticamente
2. Para testar exclusão manual, use: testDeleteExpense('ID_DA_DESPESA')
3. Verifique os resultados acima para identificar problemas
4. Se houver erros, copie e cole no chat para análise`);