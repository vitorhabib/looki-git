import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Carregar variáveis de ambiente do arquivo .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientCreation() {
  console.log('🧪 Testando criação de cliente...');
  
  try {
    // 1. Verificar organizações existentes
    console.log('\n📋 Verificando organizações...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) {
      console.error('❌ Erro ao buscar organizações:', orgError);
      return;
    }
    
    console.log(`✅ Organizações encontradas: ${orgs.length}`);
    if (orgs.length === 0) {
      console.log('❌ Nenhuma organização encontrada');
      return;
    }
    
    const org = orgs[0];
    console.log(`🏢 Usando organização: ${org.name} (${org.id})`);
    
    // 2. Tentar criar um cliente de teste
    console.log('\n👤 Criando cliente de teste...');
    const clientData = {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '(11) 99999-9999',
      address: 'Rua Teste, 123',
      organization_id: org.id
    };
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (clientError) {
      console.error('❌ Erro ao criar cliente:', clientError);
      console.log('📝 Detalhes do erro:', JSON.stringify(clientError, null, 2));
      
      // Verificar se é problema de RLS
      if (clientError.code === '42501' || clientError.message.includes('policy')) {
        console.log('\n🔒 Problema de política RLS detectado!');
        console.log('💡 Execute o script fix_billing_rls.sql no Supabase Dashboard');
      }
      return;
    }
    
    console.log('✅ Cliente criado com sucesso:', client);
    
    // 3. Verificar se o cliente foi realmente criado
    console.log('\n🔍 Verificando cliente criado...');
    const { data: createdClient, error: verifyError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar cliente:', verifyError);
      return;
    }
    
    console.log('✅ Cliente verificado:', createdClient);
    
    // 4. Tentar criar uma fatura de teste
    console.log('\n📄 Criando fatura de teste...');
    const invoiceData = {
      invoice_number: 'TEST-001',
      client_id: client.id,
      organization_id: org.id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: 1000.00,
      tax_amount: 100.00,
      total_amount: 1100.00,
      notes: 'Fatura de teste'
    };
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();
    
    if (invoiceError) {
      console.error('❌ Erro ao criar fatura:', invoiceError);
      console.log('📝 Detalhes do erro:', JSON.stringify(invoiceError, null, 2));
      return;
    }
    
    console.log('✅ Fatura criada com sucesso:', invoice);
    
    // 5. Verificar contagens finais
    console.log('\n📊 Verificando contagens finais...');
    
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    console.log(`👥 Total de clientes: ${clientCount}`);
    console.log(`📄 Total de faturas: ${invoiceCount}`);
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o teste
testClientCreation();