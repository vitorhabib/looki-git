# Configuração do Supabase

Este projeto utiliza Supabase para autenticação. Siga os passos abaixo para configurar:

## 1. Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto

## 2. Obter as credenciais

1. No dashboard do seu projeto Supabase, vá em **Settings** > **API**
2. Copie a **URL** e a **anon public key**

## 3. Configurar variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite o arquivo `.env.local` e substitua pelos valores reais:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_publica_anonima_real
   ```

**⚠️ IMPORTANTE:** Sem essas configurações, você verá o erro "Configuração do Supabase inválida" ao tentar fazer login ou registro.

## 4. Atualizar o arquivo de configuração

Edite o arquivo `src/lib/supabase.ts` e substitua as URLs e chaves de exemplo pelas suas credenciais reais.

## 5. Configurar autenticação

No dashboard do Supabase:

1. Vá em **Authentication** > **Settings**
2. Configure as URLs de redirecionamento se necessário
3. Ative os provedores de autenticação desejados

## 6. Estrutura do banco (opcional)

Se desejar, você pode criar tabelas adicionais para armazenar dados específicos da aplicação:

```sql
-- Exemplo de tabela para perfis de usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Funcionalidades implementadas

- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Recuperação de senha
- ✅ Logout
- ✅ Proteção de rotas
- ✅ Contexto de autenticação global
- ✅ Feedback visual com toasts

## Próximos passos

1. Configure suas credenciais do Supabase
2. Teste o login e registro
3. Personalize as validações conforme necessário
4. Implemente funcionalidades adicionais como perfis de usuário