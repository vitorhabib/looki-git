# Guia de Configuração do Master Admin

Este guia explica como configurar o sistema de Master Admin no Supabase para o seu projeto SaaS.

## 📋 Pré-requisitos

- Projeto Supabase configurado
- Usuário registrado na aplicação (para promover a Master Admin)
- Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1. Executar Script de Configuração

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Execute o arquivo `master_admin_production_setup.sql`
3. Aguarde a confirmação de sucesso

### 2. Criar Primeiro Master Admin

1. **Faça login na aplicação** para garantir que seu usuário existe
2. No **SQL Editor**, execute:
   ```sql
   -- Ver usuários disponíveis
   SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
   ```
3. **Copie seu `user_id`** da query acima
4. Execute o comando de promoção:
   ```sql
   SELECT promote_to_master_admin(
     'SEU_USER_ID_AQUI',
     'seu-email@exemplo.com',
     'Seu Nome Completo'
   );
   ```

### 3. Verificar Configuração

```sql
-- Verificar se foi criado
SELECT * FROM master_admins;

-- Testar função
SELECT is_master_admin('SEU_USER_ID_AQUI');

-- Ver estatísticas (só funciona se você for master admin)
SELECT * FROM saas_stats;
```

## 🔧 Estrutura Criada

### Tabelas
- **`master_admins`**: Armazena os administradores master
- **`saas_stats`**: View com estatísticas globais do SaaS

### Funções
- **`is_master_admin(user_uuid)`**: Verifica se usuário é master admin
- **`promote_to_master_admin()`**: Promove usuário a master admin
- **`remove_master_admin()`**: Remove master admin

### Políticas RLS
- Master admins podem ver **todas** as organizações
- Master admins podem ver **todos** os usuários
- Master admins podem ver **todos** os dados (clientes, faturas, despesas)
- Usuários normais continuam vendo apenas seus dados

## 🎯 Funcionalidades do Master Admin

### No Frontend
- **Botão "Administrador Master"** no sidebar (visível apenas para master admins)
- **Item "Painel Master"** no menu do usuário (header)
- **Dashboard completo** com métricas globais
- **Gestão de organizações** e usuários
- **Relatórios consolidados**

### Permissões
- ✅ Ver todas as organizações
- ✅ Ver todos os usuários
- ✅ Ver todos os clientes, faturas e despesas
- ✅ Acessar estatísticas globais
- ✅ Gerenciar outros master admins
- ✅ Monitorar sistema

## 🔒 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- **Políticas específicas** para master admins
- **Funções SECURITY DEFINER** para operações sensíveis
- **Não é possível** remover o último master admin
- **Verificação automática** de permissões no frontend

## 🐛 Solução de Problemas

### Erro: "function is_master_admin does not exist"
- Execute o script `master_admin_production_setup.sql`
- Verifique se não há erros no SQL Editor

### Botão Master Admin não aparece
- Verifique se você foi promovido a master admin
- Teste a função: `SELECT is_master_admin('SEU_USER_ID');`
- Verifique o console do navegador para erros

### Erro de permissão ao acessar dados
- Verifique se as políticas RLS foram criadas
- Execute: `SELECT * FROM pg_policies WHERE tablename = 'organizations';`

## 📝 Comandos Úteis

```sql
-- Listar todos os master admins
SELECT ma.*, au.email as auth_email 
FROM master_admins ma 
JOIN auth.users au ON ma.user_id = au.id;

-- Ver estatísticas do SaaS
SELECT * FROM saas_stats;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('master_admins', 'organizations');

-- Promover outro usuário
SELECT promote_to_master_admin(
  'USER_ID_DO_OUTRO_USUARIO',
  'email@exemplo.com',
  'Nome do Usuário'
);

-- Remover master admin
SELECT remove_master_admin('USER_ID_PARA_REMOVER');
```

## ✅ Checklist de Verificação

- [ ] Script `master_admin_production_setup.sql` executado
- [ ] Primeiro master admin criado
- [ ] Função `is_master_admin()` funcionando
- [ ] Botão "Administrador Master" aparece no sidebar
- [ ] Painel Master Admin acessível
- [ ] Estatísticas globais carregando
- [ ] Políticas RLS funcionando corretamente

## 🎉 Pronto!

Seu sistema Master Admin está configurado! Agora você pode:

1. **Acessar o painel Master Admin** através do botão no sidebar
2. **Monitorar todas as organizações** e usuários
3. **Ver relatórios consolidados** do SaaS
4. **Gerenciar outros master admins** conforme necessário

---

**Importante**: Mantenha suas credenciais de Master Admin seguras, pois elas dão acesso total ao sistema!