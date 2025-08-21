# Configuração do Banco de Dados Supabase

Este diretório contém as migrações SQL necessárias para configurar o banco de dados do sistema de gestão de agências.

## Como executar as migrações

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `migrations/001_create_categories_table.sql`
5. Execute o script clicando em **Run**

### Opção 2: Via CLI do Supabase

Se você tem o CLI do Supabase instalado:

```bash
# Instalar o CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Executar migrações
supabase db push
```

## Estrutura das Tabelas

### Tabela `categories`

Armazena as categorias de despesas e receitas por organização.

**Campos:**
- `id` (UUID): Identificador único
- `name` (VARCHAR): Nome da categoria
- `description` (TEXT): Descrição detalhada
- `type` (VARCHAR): Tipo - 'expense' ou 'revenue'
- `color` (VARCHAR): Cor hexadecimal para identificação visual
- `organization_id` (UUID): ID da organização proprietária
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data da última atualização

**Recursos implementados:**
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de segurança por organização
- ✅ Índices para performance
- ✅ Trigger para atualização automática de `updated_at`
- ✅ Categorias padrão inseridas automaticamente

## Segurança

O sistema implementa Row Level Security (RLS) para garantir que:
- Usuários só podem ver categorias da sua organização
- Usuários só podem criar/editar/excluir categorias da sua organização
- Isolamento completo de dados entre organizações

## Próximos Passos

Após executar as migrações:

1. ✅ Teste a criação de categorias na aplicação
2. ✅ Verifique se as políticas de segurança estão funcionando
3. ✅ Customize as categorias padrão conforme necessário

## Troubleshooting

### Erro: "relation 'categories' does not exist"
- Certifique-se de que executou a migração `001_create_categories_table.sql`
- Verifique se está conectado ao projeto correto do Supabase

### Erro: "permission denied for table categories"
- Verifique se o RLS está configurado corretamente
- Confirme se o usuário está autenticado
- Verifique se o `organization_id` está sendo passado corretamente

### Performance lenta
- Os índices foram criados automaticamente na migração
- Para grandes volumes de dados, considere índices adicionais conforme necessário