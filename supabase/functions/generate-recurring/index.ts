import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Iniciando geração de faturas e despesas recorrentes...')

    // Gerar faturas recorrentes
    const { data: invoicesResult, error: invoicesError } = await supabaseClient
      .rpc('generate_recurring_invoices')

    if (invoicesError) {
      console.error('❌ Erro ao gerar faturas recorrentes:', invoicesError)
      throw invoicesError
    }

    console.log(`✅ Faturas recorrentes geradas: ${invoicesResult || 0}`)

    // Gerar despesas recorrentes
    const { data: expensesResult, error: expensesError } = await supabaseClient
      .rpc('generate_recurring_expenses')

    if (expensesError) {
      console.error('❌ Erro ao gerar despesas recorrentes:', expensesError)
      throw expensesError
    }

    console.log(`✅ Despesas recorrentes geradas: ${expensesResult || 0}`)

    const result = {
      success: true,
      message: 'Recorrências processadas com sucesso',
      invoicesGenerated: invoicesResult || 0,
      expensesGenerated: expensesResult || 0,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Resultado final:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('💥 Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})