# 🔧 Instruções para Corrigir Erros da Tabela Organizations

## Problema Identificado
Os erros "Could not find the 'address' column of 'organizations'" e "Could not find the 'updated_at' column of 'organizations'" indicam que a estrutura completa da tabela `organizations` não foi criada no banco de dados Supabase.

## Solução: Executar Script Consolidado de Migração

### Passo 1: Acessar o Supabase Dashboard
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto: `jjqhgvnzjwkhsrebcjvn`

### Passo 2: Abrir o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** para criar uma nova consulta

### Passo 3: Executar o Script Consolidado
1. Copie todo o conteúdo do arquivo `fix_address_column.sql`
2. Cole no SQL Editor
3. Clique em **Run** para executar

### Passo 4: Verificar os Resultados
O script consolidado irá:
- ✅ Verificar se a tabela `organizations` existe
- ✅ Criar a tabela completa se não existir (baseado na migração 004)
- ✅ Adicionar todas as colunas necessárias: `email`, `phone`, `address`, `website`, `updated_at`
- ✅ Criar função e trigger para atualizar `updated_at` automaticamente
- ✅ Criar índices para performance (`created_by`, `email`)
- ✅ Habilitar Row Level Security (RLS)
- ✅ Adicionar comentários de documentação
- ✅ Executar testes de verificação completos

### Passo 5: Reiniciar o Servidor de Desenvolvimento
Após executar a migração:
1. Pare o servidor: `Ctrl+C` no terminal
2. Inicie novamente: `npm run dev`
3. Teste a página de configurações

## Arquivos Criados

### 📄 `fix_address_column.sql`
Script SQL consolidado e corrigido que verifica a estrutura atual da tabela `organizations` e adiciona apenas as colunas que estão faltando (`description`, `email`, `phone`, `address`, `website`, `updated_at`), além de criar triggers, índices e políticas necessárias.

## Verificação Final

Após executar a migração:
1. Abra a aplicação: `http://localhost:8081`
2. Vá para a página de **Configurações**
3. Tente salvar as informações da organização
4. Todos os erros relacionados à estrutura da tabela `organizations` devem ter desaparecido

## Troubleshooting

### Se os erros persistirem:
1. Verifique se o script foi executado com sucesso (sem erros no Supabase)
2. Confirme que todas as colunas foram criadas consultando a estrutura da tabela
3. Reinicie o servidor de desenvolvimento para limpar o cache do schema
4. Limpe o cache do navegador (Ctrl+Shift+R)
5. Verifique se o trigger `update_organizations_updated_at` foi criado

### Se aparecerem outros erros:
1. Verifique as políticas RLS (Row Level Security)
2. Confirme que o usuário tem permissões adequadas
3. Verifique se todas as tabelas relacionadas existem

## Contato
Se o problema persistir após seguir estas instruções, forneça:
- Screenshot do erro no Supabase Dashboard
- Logs do console do navegador
- Resultado da execução do script SQL