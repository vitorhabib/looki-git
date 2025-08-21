# 🔧 Instruções para Corrigir Políticas RLS

## ❌ Problema Identificado

As despesas não estão sendo registradas no banco de dados devido a **políticas RLS (Row Level Security) incorretas** nas tabelas `expenses` e `categories`.

## 🚀 Solução: Execute o Script SQL

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto **org-flow-pro**

### Passo 2: Abra o SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### Passo 3: Execute o Script de Correção
1. Copie todo o conteúdo do arquivo `fix_rls_policies.sql`
2. Cole no SQL Editor
3. Clique em **"Run"** para executar

### Passo 4: Verifique se as Políticas foram Aplicadas
Após executar o script, você deve ver uma tabela mostrando as políticas criadas:

```
schemaname | tablename  | policyname
-----------+------------+------------------------------------------
public     | categories | Users can view categories from their organizations
public     | categories | Users can insert categories for their organizations
public     | expenses   | Users can view expenses from their organizations
public     | expenses   | Users can insert expenses for their organizations
```

## 🧪 Teste a Correção

### Opção 1: Teste Automático
1. Acesse: `http://localhost:8081/debug_user_organization.html`
2. Observe os logs no navegador
3. Deve mostrar associações do usuário e teste de inserção

### Opção 2: Teste Manual
1. Acesse a aplicação principal: `http://localhost:8081`
2. Tente criar uma nova despesa
3. Verifique se aparece a mensagem de sucesso
4. Recarregue a página para ver se a despesa foi salva

## ✅ Resultado Esperado

Após aplicar as correções:
- ✅ Despesas serão registradas no banco de dados
- ✅ Categorias funcionarão corretamente
- ✅ Usuários só verão dados de suas organizações
- ✅ Segurança dos dados será mantida

## 🆘 Se Ainda Houver Problemas

1. **Verifique se você está logado** na aplicação
2. **Confirme se pertence a uma organização**:
   - Acesse `http://localhost:8081/debug_user_organization.html`
   - Deve mostrar pelo menos uma organização
3. **Verifique o console do navegador** para erros específicos
4. **Teste com dados simples** primeiro (título, valor, data)

---

**⚠️ IMPORTANTE**: Execute o script SQL **apenas uma vez**. Se executar novamente, pode gerar erros de "policy already exists", mas isso não afetará o funcionamento.