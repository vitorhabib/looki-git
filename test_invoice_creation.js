// Script de teste para verificar criação de faturas
import { supabase } from './src/lib/supabase.js';

async function testInvoiceCreation() {
  console.log('🧪 Testando criação de fatura...');
  
  // Verificar sessão
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('👤 Sessão:', { user: session?.user?.id, error: sessionError });
  
  if (!session?.user) {
    console.error('❌ Usuário não autenticado');
    return;
  }
  
  // Verificar organizações do usuário
  const { data: userOrgs, error: userOrgsError } = await supabase
    .from('user_organizations')
    .select('*')
    .eq('user_id', session.user.id);
  
  console.log('🏢 Organizações do usuário:', { data: userOrgs, error: userOrgsError });
  
  if (!userOrgs || userOrgs.length === 0) {
    console.error('❌ Usuário não pertence a nenhuma organização');
    return;
  }
  
  const orgId = userOrgs[0].organization_id;
  
  // Verificar clientes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId);
  
  console.log('👥 Clientes:', { data: clients, error: clientsError });
  
  if (!clients || clients.length === 0) {
    console.error('❌ Nenhum cliente encontrado');
    return;
  }
  
  // Tentar criar uma fatura de teste
  const testInvoice = {
    client_id: clients[0].id,
    organization_id: orgId,
    invoice_number: 'TEST-' + Date.now(),
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 100.00,
    tax_amount: 0.00,
    discount_amount: 0.00,
    total_amount: 100.00,
    notes: 'Fatura de teste',
    payment_terms: 'Pagamento em 30 dias'
  };
  
  console.log('📋 Dados da fatura de teste:', testInvoice);
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([testInvoice])
    .select()
    .single();
  
  console.log('✅ Resultado:', { data: invoice, error: invoiceError });
  
  if (invoiceError) {
    console.error('❌ Erro detalhado:', {
      code: invoiceError.code,
      message: invoiceError.message,
      details: invoiceError.details,
      hint: invoiceError.hint
    });
  } else {
    console.log('🎉 Fatura criada com sucesso!');
    
    // Limpar fatura de teste
    await supabase.from('invoices').delete().eq('id', invoice.id);
    console.log('🧹 Fatura de teste removida');
  }
}

testInvoiceCreation().catch(console.error);