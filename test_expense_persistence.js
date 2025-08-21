// Script para testar a persistência de despesas no Supabase
// Execute este script no console do navegador após fazer login na aplicação

async function testExpensePersistence() {
    console.log('🧪 Iniciando teste de persistência de despesas...');
    
    try {
        // Verificar se o Supabase está disponível
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase não está disponível no window');
            return;
        }
        
        const supabase = window.supabase;
        
        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('❌ Usuário não autenticado:', authError?.message);
            return;
        }
        
        console.log('✅ Usuário autenticado:', user.email);
        
        // Buscar organizações
        const { data: userOrgs, error: orgError } = await supabase
            .from('user_organizations')
            .select(`
                organization_id,
                role,
                organizations!inner(*)
            `)
            .eq('user_id', user.id);
            
        if (orgError || !userOrgs || userOrgs.length === 0) {
            console.error('❌ Erro ao buscar organizações:', orgError?.message);
            return;
        }
        
        const orgId = userOrgs[0].organization_id;
        console.log('✅ Organização encontrada:', userOrgs[0].organizations.name, '(ID:', orgId, ')');
        
        // Contar despesas existentes
        const { data: existingExpenses, error: countError } = await supabase
            .from('expenses')
            .select('id, title, created_at')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });
            
        if (countError) {
            console.error('❌ Erro ao contar despesas existentes:', countError.message);
            return;
        }
        
        console.log('📊 Despesas existentes:', existingExpenses?.length || 0);
        if (existingExpenses && existingExpenses.length > 0) {
            console.log('📋 Últimas 3 despesas:');
            existingExpenses.slice(0, 3).forEach((expense, index) => {
                console.log(`  ${index + 1}. ${expense.title} (${expense.created_at})`);
            });
        }
        
        // Criar uma despesa de teste
        const testExpense = {
            title: `Teste de Persistência - ${new Date().toLocaleString()}`,
            description: 'Despesa criada para testar persistência no banco',
            amount: 99.99,
            organization_id: orgId,
            expense_date: new Date().toISOString().split('T')[0],
            payment_method: 'credit_card',
            status: 'pending'
        };
        
        console.log('💰 Criando despesa de teste:', testExpense);
        
        const { data: newExpense, error: createError } = await supabase
            .from('expenses')
            .insert([testExpense])
            .select(`
                *,
                category:categories(*)
            `)
            .single();
            
        if (createError) {
            console.error('❌ Erro ao criar despesa:', createError.message);
            console.error('❌ Detalhes do erro:', createError);
            return;
        }
        
        if (!newExpense) {
            console.error('❌ Nenhuma despesa retornada após criação');
            return;
        }
        
        console.log('✅ Despesa criada com sucesso!');
        console.log('📋 Dados da nova despesa:', newExpense);
        
        // Aguardar um pouco e verificar se a despesa ainda existe
        console.log('⏳ Aguardando 2 segundos para verificar persistência...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: verifyExpense, error: verifyError } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', newExpense.id)
            .single();
            
        if (verifyError) {
            console.error('❌ Erro ao verificar despesa:', verifyError.message);
            return;
        }
        
        if (verifyExpense) {
            console.log('✅ Despesa confirmada no banco de dados!');
            console.log('📋 Dados verificados:', verifyExpense);
        } else {
            console.error('❌ Despesa não encontrada no banco após criação');
        }
        
        // Contar despesas novamente
        const { data: finalCount, error: finalCountError } = await supabase
            .from('expenses')
            .select('id')
            .eq('organization_id', orgId);
            
        if (!finalCountError) {
            console.log('📊 Total de despesas após teste:', finalCount?.length || 0);
        }
        
        console.log('🎉 Teste de persistência concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error);
    }
}

// Executar o teste
testExpensePersistence();

// Também disponibilizar a função globalmente para execução manual
window.testExpensePersistence = testExpensePersistence;
console.log('💡 Função testExpensePersistence() disponível para execução manual');