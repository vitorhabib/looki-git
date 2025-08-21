// Script para criar um cliente de teste
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjqhgvnzjwkhsrebcjvn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcWhndm56andraHNyZWJjanZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MTEyOTMsImV4cCI6MjA2Njk4NzI5M30.3lQZZ1l0umn1PWtS7EcoFvkZBgB9pZcqYZg92LhhXhw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestClient() {
  console.log('👥 Criando cliente de teste...');
  
  try {
    // Buscar a organização existente
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError || !orgs || orgs.length === 0) {
      console.error('❌ Nenhuma organização encontrada:', orgsError);
      return;
    }
    
    const orgId = orgs[0].id;
    console.log('🏢 Usando organização:', orgs[0].name, '(ID:', orgId, ')');
    
    // Criar cliente de teste
    const testClient = {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '(11) 99999-9999',
      document: '123.456.789-00',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      country: 'Brasil',
      organization_id: orgId
    };
    
    console.log('📋 Dados do cliente:', testClient);
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([testClient])
      .select()
      .single();
    
    if (clientError) {
      console.error('❌ Erro ao criar cliente:', clientError);
      return;
    }
    
    console.log('✅ Cliente criado com sucesso!');
    console.log('Cliente ID:', client.id);
    console.log('Nome:', client.name);
    console.log('Email:', client.email);
    
    // Agora tentar criar uma fatura de teste
    console.log('\n📄 Criando fatura de teste...');
    
    const testInvoice = {
      client_id: client.id,
      organization_id: orgId,
      invoice_number: 'TEST-' + Date.now(),
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: 1000.00,
      tax_amount: 100.00,
      discount_amount: 50.00,
      total_amount: 1050.00,
      notes: 'Fatura de teste criada automaticamente',
      payment_terms: 'Pagamento em 30 dias'
    };
    
    console.log('📋 Dados da fatura:', testInvoice);
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([testInvoice])
      .select()
      .single();
    
    if (invoiceError) {
      console.error('❌ Erro ao criar fatura:', invoiceError);
    } else {
      console.log('✅ Fatura criada com sucesso!');
      console.log('Fatura ID:', invoice.id);
      console.log('Número:', invoice.invoice_number);
      console.log('Total:', invoice.total_amount);
      console.log('Organização ID:', invoice.organization_id);
      
      // Verificar se a associação está correta
      if (invoice.organization_id === orgId && invoice.client_id === client.id) {
        console.log('🎉 Associação perfeita! Fatura está corretamente vinculada à organização e cliente.');
      } else {
        console.log('⚠️ Problema na associação!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestClient();