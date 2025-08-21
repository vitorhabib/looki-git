# Edge Functions - Sistema de Recorrência

Este diretório contém as Edge Functions do Supabase para automatizar o sistema de recorrência de faturas e despesas.

## 📁 Estrutura

```
supabase/functions/
├── deno.json                    # Configuração do Deno
├── README.md                    # Este arquivo
└── generate-recurring/
    ├── index.ts                 # Edge Function principal
    └── cron.json               # Configuração do cron job
```

## 🚀 Deploy da Edge Function

### 1. Pré-requisitos

- Supabase CLI instalado: `npm install -g supabase`
- Projeto linkado: `supabase link --project-ref SEU_PROJECT_REF`
- Login realizado: `supabase login`

### 2. Deploy

```bash
# Deploy da função
supabase functions deploy generate-recurring

# Verificar se foi deployada
supabase functions list
```

### 3. Configurar Variáveis de Ambiente

No dashboard do Supabase, vá em **Edge Functions** > **Settings** e adicione:

- `SUPABASE_URL`: URL do seu projeto
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (encontrada em Settings > API)

### 4. Configurar Cron Job

#### Opção A: Via Dashboard (Recomendado)
1. Acesse **Edge Functions** no dashboard
2. Selecione a função `generate-recurring`
3. Vá em **Cron Jobs**
4. Adicione um novo cron job:
   - **Schedule**: `0 6 * * *` (diariamente às 6:00 AM)
   - **Timezone**: `America/Sao_Paulo`

#### Opção B: Via CLI
```bash
# Criar cron job
supabase functions deploy generate-recurring --schedule "0 6 * * *"
```

## 🧪 Teste Manual

### Via CLI
```bash
# Invocar a função manualmente
supabase functions invoke generate-recurring
```

### Via HTTP
```bash
# Fazer requisição HTTP direta
curl -X POST 'https://SEU_PROJECT_REF.supabase.co/functions/v1/generate-recurring' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Via Interface Web
Crie um botão na interface administrativa para executar manualmente:

```typescript
const executeRecurring = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-recurring')
    if (error) throw error
    console.log('Resultado:', data)
  } catch (error) {
    console.error('Erro:', error)
  }
}
```

## 📊 Monitoramento

### Logs da Função
```bash
# Ver logs em tempo real
supabase functions logs generate-recurring --follow
```

### Dashboard
- Acesse **Edge Functions** > `generate-recurring` > **Logs**
- Monitore execuções, erros e performance

## 🔧 Funcionamento

A Edge Function:

1. **Executa diariamente às 6:00 AM** (horário de Brasília)
2. **Chama as funções SQL**:
   - `generate_recurring_invoices()`: Gera faturas recorrentes
   - `generate_recurring_expenses()`: Gera despesas recorrentes
3. **Retorna estatísticas**:
   - Número de faturas geradas
   - Número de despesas geradas
   - Timestamp da execução
4. **Registra logs** para monitoramento

## 🛠️ Personalização

### Alterar Horário de Execução
Edite o arquivo `cron.json` ou configure no dashboard:

```json
{
  "schedule": "0 8 * * *",  // 8:00 AM
  "description": "Executa às 8:00 AM",
  "timezone": "America/Sao_Paulo"
}
```

### Adicionar Notificações
Modifique `index.ts` para enviar emails ou webhooks:

```typescript
// Exemplo: enviar email de relatório
if (invoicesResult > 0 || expensesResult > 0) {
  await sendNotificationEmail({
    invoices: invoicesResult,
    expenses: expensesResult
  })
}
```

## 🚨 Troubleshooting

### Função não executa
1. Verifique se o cron job está ativo no dashboard
2. Confirme as variáveis de ambiente
3. Verifique os logs para erros

### Erro de permissão
1. Confirme que está usando a `SUPABASE_SERVICE_ROLE_KEY`
2. Verifique se as funções SQL existem no banco

### Erro nas funções SQL
1. Execute manualmente no SQL Editor:
   ```sql
   SELECT generate_recurring_invoices();
   SELECT generate_recurring_expenses();
   ```
2. Verifique se as migrações foram aplicadas

## 📈 Próximos Passos

- [ ] Implementar notificações por email
- [ ] Adicionar métricas de performance
- [ ] Criar dashboard de monitoramento
- [ ] Implementar retry automático em caso de falha
- [ ] Adicionar validações adicionais