# Guia de Instalação e Deploy no VPS - Looki Frontend

## 📋 Pré-requisitos

### 1. Sistema Operacional
- Ubuntu 20.04 LTS ou superior
- CentOS 8 ou superior
- Debian 11 ou superior

### 2. Recursos Mínimos do VPS
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Armazenamento**: 40GB SSD
- **Largura de banda**: 100 Mbps

### 3. Acesso
- Acesso SSH como usuário com privilégios sudo
- Domínio configurado (opcional, mas recomendado para SSL)

## 🚀 Instalação Inicial

### Passo 1: Atualizar o Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Passo 2: Instalar Docker
```bash
# Remover versões antigas
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release -y

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar para aplicar mudanças
sudo systemctl enable docker
sudo systemctl start docker
```

### Passo 3: Verificar Instalação
```bash
docker --version
docker compose version
```

## 📁 Preparação do Projeto

### Passo 1: Criar Estrutura de Diretórios
```bash
sudo mkdir -p /opt/looki-frontend
sudo chown -R $USER:$USER /opt/looki-frontend
cd /opt/looki-frontend
```

### Passo 2: Fazer Upload dos Arquivos
Faça upload de todos os arquivos do projeto para `/opt/looki-frontend/`:

**Arquivos essenciais:**
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/` (diretório completo)
- `public/` (diretório completo)
- `Dockerfile`
- `docker-compose.prod.yml`
- `nginx.conf`
- `nginx-ssl.conf`
- `.env.production`
- `deploy-vps.sh`
- `monitor-vps.sh`
- `backup-vps.sh`
- `systemd-services.sh`

### Passo 3: Configurar Permissões
```bash
chmod +x deploy-vps.sh
chmod +x monitor-vps.sh
chmod +x backup-vps.sh
chmod +x systemd-services.sh
```

## ⚙️ Configuração

### Passo 1: Configurar Variáveis de Ambiente
```bash
# Editar arquivo de produção
nano .env.production
```

**Configure as seguintes variáveis:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Application Configuration
VITE_APP_URL=https://seudominio.com
VITE_APP_NAME=Looki Frontend
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Performance
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

### Passo 2: Configurar Firewall
```bash
# Instalar UFW se não estiver instalado
sudo apt install ufw -y

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir porta da aplicação
sudo ufw allow 9090/tcp

# Ativar firewall
sudo ufw enable
```

## 🚀 Deploy da Aplicação

### Método 1: Deploy Automático
```bash
# Executar script de deploy
./deploy-vps.sh
```

### Método 2: Deploy Manual
```bash
# Build da aplicação
docker compose -f docker-compose.prod.yml build

# Iniciar aplicação
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

## 🔒 Configuração SSL/HTTPS

### Passo 1: Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Passo 2: Obter Certificado SSL
```bash
# Parar aplicação temporariamente
docker compose -f docker-compose.prod.yml down

# Obter certificado
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados para o projeto
sudo mkdir -p /opt/looki-frontend/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem /opt/looki-frontend/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem /opt/looki-frontend/ssl/
sudo chown -R $USER:$USER /opt/looki-frontend/ssl
```

### Passo 3: Configurar Nginx para SSL
```bash
# Usar configuração SSL
cp nginx-ssl.conf nginx.conf

# Editar e ajustar domínio
nano nginx.conf
```

### Passo 4: Reiniciar com SSL
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 🔄 Automação e Monitoramento

### Passo 1: Configurar Serviços Systemd
```bash
# Instalar serviços automáticos
./systemd-services.sh install

# Verificar status
./systemd-services.sh status
```

### Passo 2: Configurar Backups
```bash
# Configurar diretórios de backup
./backup-vps.sh setup

# Testar backup manual
./backup-vps.sh daily
```

### Passo 3: Configurar Monitoramento
```bash
# Testar monitoramento
./monitor-vps.sh status

# Ver logs em tempo real
./monitor-vps.sh logs
```

## 📊 Verificação e Testes

### Passo 1: Verificar Aplicação
```bash
# Verificar containers
docker ps

# Verificar logs
docker logs looki-frontend-prod

# Testar aplicação
curl -I http://localhost:9090
```

### Passo 2: Testar Performance
```bash
# Instalar ferramentas de teste
sudo apt install apache2-utils -y

# Teste de carga básico
ab -n 100 -c 10 http://localhost:9090/
```

### Passo 3: Verificar SSL (se configurado)
```bash
# Testar SSL
curl -I https://seudominio.com

# Verificar certificado
openssl s_client -connect seudominio.com:443 -servername seudominio.com
```

## 🛠️ Manutenção

### Comandos Úteis
```bash
# Ver status da aplicação
./monitor-vps.sh status

# Reiniciar aplicação
docker compose -f docker-compose.prod.yml restart

# Ver logs
docker logs looki-frontend-prod -f

# Backup manual
./backup-vps.sh daily

# Listar backups
./backup-vps.sh list

# Atualizar aplicação
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Logs Importantes
- **Aplicação**: `docker logs looki-frontend-prod`
- **Nginx**: `/var/log/looki-nginx/`
- **Sistema**: `/var/log/looki-*.log`
- **Backup**: `/var/log/looki-backup.log`
- **Monitor**: `/var/log/looki-monitor.log`

## 🚨 Solução de Problemas

### Problema: Aplicação não inicia
```bash
# Verificar logs
docker logs looki-frontend-prod

# Verificar configuração
docker compose -f docker-compose.prod.yml config

# Reconstruir imagem
docker compose -f docker-compose.prod.yml build --no-cache
```

### Problema: Alto uso de recursos
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de erro
./monitor-vps.sh monitor
```

### Problema: SSL não funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar configuração nginx
nginx -t
```

## 📞 Suporte

### Informações do Sistema
```bash
# Gerar relatório completo
./monitor-vps.sh report
```

### Contatos
- **Documentação**: Este arquivo
- **Logs**: `/var/log/looki-*.log`
- **Backups**: `/var/backups/looki/`

---

## 📝 Checklist de Deploy

- [ ] VPS configurado com recursos adequados
- [ ] Docker instalado e funcionando
- [ ] Arquivos do projeto enviados
- [ ] Variáveis de ambiente configuradas
- [ ] Firewall configurado
- [ ] Aplicação deployada e funcionando
- [ ] SSL configurado (se aplicável)
- [ ] Serviços systemd instalados
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Testes de performance realizados
- [ ] Documentação revisada

**🎉 Parabéns! Sua aplicação Looki Frontend está rodando em produção no VPS!**