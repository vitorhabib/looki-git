// Teste para verificar se as faturas estão sendo associadas à organização correta
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjqhgvnzjwkhsrebcjvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcWhndm56andraHNyZWJjanZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MTEyOTMsImV4cCI6MjA2Njk4NzI5M30.3lQZZ1l0umn1PWtS7EcoFvkZBgB9pZcqYZg92LhhXhw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceOrganizationAssociation() {
  console.log('🧪 Testando associação de faturas com organizações...');
  
  try {
    // Verificar faturas existentes
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        organization_id,
        client_id,
        total_amount,
        created_at,
        organization:organizations(id, name),
        client:clients(id, name, organization_id)
      `);
    
    console.log('📊 Faturas no banco:', { count: invoices?.length || 0, error: invoicesError });
    
    if (invoices && invoices.length > 0) {
      console.log('📋 Detalhes das faturas:');
      invoices.forEach((invoice, index) => {
        console.log(`\n--- Fatura ${index + 1} ---`);
        console.log('ID:', invoice.id);
        console.log('Número:', invoice.invoice_number);
        console.log('Organization ID:', invoice.organization_id);
        console.log('Organização:', invoice.organization?.name || 'Não encontrada');
        console.log('Cliente ID:', invoice.client_id);
        console.log('Cliente:', invoice.client?.name || 'Não encontrado');
        console.log('Cliente Org ID:', invoice.client?.organization_id);
        console.log('Total:', invoice.total_amount);
        console.log('Criada em:', invoice.created_at);
        
        // Verificar se a organização da fatura coincide com a do cliente
        if (invoice.organization_id === invoice.client?.organization_id) {
          console.log('✅ Associação correta: Fatura e cliente pertencem à mesma organização');
        } else {
          console.log('❌ Problema: Fatura e cliente pertencem a organizações diferentes!');
        }
      });
    }
    
    // Verificar organizações
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*');
    
    console.log('\n🏢 Organizações no banco:', { count: orgs?.length || 0, error: orgsError });
    if (orgs) {
      orgs.forEach(org => {
        console.log(`- ${org.name} (ID: ${org.id})`);
      });
    }
    
    // Verificar clientes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    console.log('\n👥 Clientes no banco:', { count: clients?.length || 0, error: clientsError });
    if (clients) {
      clients.forEach(client => {
        console.log(`- ${client.name} (ID: ${client.id}, Org: ${client.organization_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testInvoiceOrganizationAssociation();