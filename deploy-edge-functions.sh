#!/bin/bash

# Script para deploy das Edge Functions do Supabase
# Sistema de Recorrência - Gestão de Agências

echo "🚀 Iniciando deploy das Edge Functions..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se está logado
echo "🔐 Verificando autenticação..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase. Execute: supabase login"
    exit 1
fi

# Verificar se o projeto está linkado
echo "🔗 Verificando link do projeto..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Projeto não está linkado. Execute: supabase link --project-ref SEU_PROJECT_REF"
    exit 1
fi

# Deploy da Edge Function
echo "📦 Fazendo deploy da função generate-recurring..."
supabase functions deploy generate-recurring

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployada com sucesso!"
else
    echo "❌ Erro no deploy da Edge Function"
    exit 1
fi

# Listar funções para confirmar
echo "📋 Funções disponíveis:"
supabase functions list

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente no dashboard do Supabase"
echo "2. Configure o cron job para execução automática"
echo "3. Teste a função manualmente: supabase functions invoke generate-recurring"
echo ""
echo "📚 Consulte o README em supabase/functions/README.md para mais detalhes"