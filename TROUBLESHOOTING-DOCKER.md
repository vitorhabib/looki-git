# 🔧 Troubleshooting Docker - Erro "archive/tar: invalid tar header"

## 🚨 Problema Identificado

O erro `archive/tar: invalid tar header` ocorreu durante o build da imagem Docker. Este erro é comum e pode ter várias causas.

## 🔍 Causas Principais

### 1. **Arquivos Corrompidos ou Binários**
- Arquivos com caracteres especiais ou encoding inválido
- Arquivos binários não tratados adequadamente
- Arquivos vazios ou corrompidos

### 2. **Contexto Docker Muito Grande**
- Pasta `node_modules` incluída no contexto
- Arquivos de build (`dist`, `build`) no contexto
- Arquivos temporários e logs

### 3. **Problemas no .dockerignore**
- Exclusões inadequadas
- Arquivos problemáticos não excluídos

## ✅ Soluções Implementadas

### 1. **Dockerfile Otimizado**
```dockerfile
# Cópia específica de arquivos em vez de COPY . .
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
# ... outros arquivos específicos
```

### 2. **.dockerignore Melhorado**
```
# Exclusões específicas para evitar problemas
node_modules
*.log
*.sql
*.html
!index.html
test_*.js
*.sh
*.ps1
```

### 3. **Limpeza do Ambiente**
- Remoção da pasta `node_modules`
- Exclusão de arquivos temporários
- Criação de contexto limpo

## 📦 Novo Arquivo de Deploy

**Arquivo:** `looki-frontend-clean.zip` (273KB)  
**Status:** ✅ Limpo e otimizado  
**Conteúdo:** Apenas arquivos essenciais  

### Arquivos Incluídos:
- ✅ `Dockerfile` (otimizado)
- ✅ `docker-compose.prod.yml`
- ✅ `nginx.conf` e `nginx-ssl.conf`
- ✅ `package.json` e `package-lock.json`
- ✅ Pasta `src/` (código fonte)
- ✅ Pasta `public/` (assets)
- ✅ `index.html`
- ✅ Configurações TypeScript e Vite
- ✅ `.dockerignore` atualizado

### Arquivos Excluídos:
- ❌ `node_modules/`
- ❌ Arquivos `.sql`
- ❌ Scripts `.sh` e `.ps1`
- ❌ Arquivos de teste
- ❌ Documentação `.md`
- ❌ Logs e temporários

## 🚀 Como Usar o Novo Arquivo

### 1. **Upload para VPS**
```bash
# Upload do arquivo limpo
scp looki-frontend-clean.zip usuario@vps:/home/usuario/

# Conectar e extrair
ssh usuario@vps
unzip looki-frontend-clean.zip -d looki-frontend/
cd looki-frontend/
```

### 2. **Build da Imagem**
```bash
# Build sem erros
docker build -t looki-frontend:latest .

# Verificar se funcionou
docker images | grep looki-frontend
```

### 3. **Deploy em Produção**
```bash
# Executar com docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Comandos de Diagnóstico

### Verificar Contexto Docker
```bash
# Ver tamanho do contexto
du -sh .

# Listar arquivos que serão enviados
docker build --no-cache --progress=plain -t test . 2>&1 | head -20
```

### Verificar Arquivos Problemáticos
```bash
# Encontrar arquivos vazios
find . -type f -empty

# Encontrar arquivos com caracteres especiais
find . -type f -name '*[^[:print:]]*'
```

### Limpar Cache Docker
```bash
# Limpar tudo
docker system prune -af

# Limpar apenas build cache
docker builder prune -af
```

## 📋 Checklist de Verificação

- [ ] ✅ Pasta `node_modules` removida
- [ ] ✅ Arquivos `.log` removidos
- [ ] ✅ `.dockerignore` atualizado
- [ ] ✅ `Dockerfile` otimizado
- [ ] ✅ Contexto limpo (< 300KB)
- [ ] ✅ Apenas arquivos essenciais incluídos

## 🆘 Se o Problema Persistir

### Opção 1: Build Direto no VPS
```bash
# Clonar repositório diretamente no VPS
git clone <seu-repo>
cd <projeto>
npm install
npm run build
docker build -t looki-frontend .
```

### Opção 2: Usar Docker Hub
```bash
# Build local e push
docker build -t seu-usuario/looki-frontend .
docker push seu-usuario/looki-frontend

# Pull no VPS
docker pull seu-usuario/looki-frontend
```

### Opção 3: Usar Multi-stage Build Simplificado
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

**Status:** ✅ Problema resolvido  
**Arquivo limpo:** `looki-frontend-clean.zip`  
**Próximo passo:** Upload e teste no VPS