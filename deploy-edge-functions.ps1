# Script PowerShell para deploy das Edge Functions do Supabase
# Sistema de Recorrência - Gestão de Agências

Write-Host "🚀 Iniciando deploy das Edge Functions..." -ForegroundColor Green

# Verificar se o Supabase CLI está instalado
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não encontrado. Instalando..." -ForegroundColor Red
    npm install -g supabase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar Supabase CLI" -ForegroundColor Red
        exit 1
    }
}

# Verificar se está logado
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não está logado no Supabase. Execute: supabase login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Autenticado com sucesso" -ForegroundColor Green

# Verificar se o projeto está linkado
Write-Host "🔗 Verificando link do projeto..." -ForegroundColor Yellow
if (-not (Test-Path ".supabase\config.toml")) {
    Write-Host "❌ Projeto não está linkado. Execute: supabase link --project-ref SEU_PROJECT_REF" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Projeto linkado" -ForegroundColor Green

# Deploy da Edge Function
Write-Host "📦 Fazendo deploy da função generate-recurring..." -ForegroundColor Yellow
supabase functions deploy generate-recurring

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy da Edge Function" -ForegroundColor Red
    exit 1
}

# Listar funções para confirmar
Write-Host "📋 Funções disponíveis:" -ForegroundColor Cyan
supabase functions list

Write-Host ""
Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure as variáveis de ambiente no dashboard do Supabase" -ForegroundColor White
Write-Host "2. Configure o cron job para execução automática" -ForegroundColor White
Write-Host "3. Teste a função manualmente: supabase functions invoke generate-recurring" -ForegroundColor White
Write-Host ""
Write-Host "📚 Consulte o README em supabase/functions/README.md para mais detalhes" -ForegroundColor Cyan

# Pausar para o usuário ler as instruções
Write-Host "\nPressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")