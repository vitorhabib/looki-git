# 📦 Looki Frontend - Pacote de Deploy

## 📋 Sobre o Pacote

Este arquivo `looki-frontend-deploy.zip` (287KB) contém todos os arquivos essenciais para fazer o deploy da aplicação Looki Frontend em produção.

## 📁 Conteúdo do Pacote

### Arquivos de Configuração Docker
- `Dockerfile` - Configuração otimizada para produção
- `docker-compose.prod.yml` - Orquestração para ambiente de produção
- `nginx.conf` - Configuração básica do Nginx
- `nginx-ssl.conf` - Configuração do Nginx com SSL/HTTPS

### Código da Aplicação
- `src/` - Código fonte completo da aplicação React/TypeScript
- `public/` - Arquivos estáticos públicos
- `index.html` - Template HTML principal

### Configurações do Projeto
- `package.json` & `package-lock.json` - Dependências do Node.js
- `vite.config.ts` - Configuração do Vite
- `tailwind.config.ts` - Configuração do Tailwind CSS
- `tsconfig.json` - Configuração do TypeScript
- `components.json` - Configuração dos componentes UI
- `postcss.config.js` - Configuração do PostCSS
- `eslint.config.js` - Configuração do ESLint

### Variáveis de Ambiente
- `.env.production` - Variáveis para produção
- `.env.example` - Exemplo de configuração

### Scripts de Automação
- `deploy-vps.sh` - Script de deploy automatizado
- `monitor-vps.sh` - Script de monitoramento
- `backup-vps.sh` - Script de backup
- `systemd-services.sh` - Configuração de serviços do sistema

### Documentação
- `GUIA-INSTALACAO-VPS.md` - Guia completo de instalação no VPS

## 🚀 Como Usar

### 1. Upload para VPS
```bash
# Fazer upload do arquivo ZIP para o VPS
scp looki-frontend-deploy.zip usuario@seu-vps:/home/usuario/

# Conectar ao VPS
ssh usuario@seu-vps

# Extrair o arquivo
unzip looki-frontend-deploy.zip -d looki-frontend/
cd looki-frontend/
```

### 2. Deploy com Docker
```bash
# Construir a imagem
docker build -t looki-frontend:latest .

# Executar em produção
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Upload para Docker Hub
```bash
# Fazer login no Docker Hub
docker login

# Tagear a imagem
docker tag looki-frontend:latest seu-usuario/looki-frontend:latest
docker tag looki-frontend:latest seu-usuario/looki-frontend:v1.0.0

# Fazer push
docker push seu-usuario/looki-frontend:latest
docker push seu-usuario/looki-frontend:v1.0.0
```

## 🔧 Configuração Necessária

1. **Instalar Docker e Docker Compose no VPS**
2. **Configurar variáveis de ambiente** (copiar de `.env.example`)
3. **Configurar domínio e SSL** (seguir `GUIA-INSTALACAO-VPS.md`)
4. **Executar scripts de automação** conforme necessário

## 📊 Recursos Incluídos

✅ **Containerização completa com Docker**  
✅ **Configuração Nginx otimizada**  
✅ **Suporte SSL/HTTPS**  
✅ **Scripts de deploy automatizado**  
✅ **Monitoramento e backup**  
✅ **Configuração de produção otimizada**  
✅ **Documentação completa**  

## 🆘 Suporte

Para dúvidas sobre o deploy, consulte:
- `GUIA-INSTALACAO-VPS.md` - Guia detalhado de instalação
- Scripts de automação incluídos no pacote
- Configurações de exemplo fornecidas

---

**Versão:** 1.0.0  
**Tamanho:** 287KB  
**Última atualização:** $(Get-Date -Format 'dd/MM/yyyy HH:mm')  
**Status:** ✅ Pronto para produção