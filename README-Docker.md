# 🐳 Docker Setup - Looki Frontend

Este guia explica como usar Docker para executar a aplicação Looki na porta 9090.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Git (para clonar o repositório)

## 🚀 Execução Rápida

### Desenvolvimento
```bash
# Build e execução
docker-compose up --build

# Execução em background
docker-compose up -d

# Parar containers
docker-compose down
```

### Produção
```bash
# Build e execução para produção
docker-compose -f docker-compose.prod.yml up --build -d

# Parar containers de produção
docker-compose -f docker-compose.prod.yml down
```

## 🛠️ Comandos Úteis

### Build Manual
```bash
# Build da imagem
docker build -t looki-frontend .

# Executar container manualmente
docker run -p 9090:80 looki-frontend
```

### Gerenciamento de Containers
```bash
# Ver containers rodando
docker ps

# Ver logs
docker-compose logs -f

# Entrar no container
docker exec -it looki-frontend sh

# Reiniciar serviços
docker-compose restart
```

### Limpeza
```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpeza completa
docker system prune -a
```

## 🌐 Deploy em VPS

### 1. Preparar VPS
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 2. Deploy Automatizado
```bash
# Dar permissão ao script
chmod +x deploy.sh

# Deploy em desenvolvimento
./deploy.sh dev

# Deploy em produção
./deploy.sh prod
```

### 3. Configurar Nginx Reverso (Opcional)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 Configurações

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Ambiente
NODE_ENV=production

# Supabase (se necessário)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# Outras configurações
VITE_API_URL=https://api.seudominio.com
```

### Customizar Porta
Para alterar a porta, edite o arquivo `docker-compose.yml`:
```yaml
ports:
  - "NOVA_PORTA:80"  # Altere NOVA_PORTA
```

## 📊 Monitoramento

### Health Check
```bash
# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' looki-frontend

# Ver logs de health check
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' looki-frontend
```

### Logs
```bash
# Logs em tempo real
docker-compose logs -f

# Logs específicos do serviço
docker-compose logs -f looki-app

# Últimas 100 linhas
docker-compose logs --tail=100
```

## 🔒 Segurança

### SSL/HTTPS com Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar o que está usando a porta
   sudo netstat -tulpn | grep :9090
   
   # Matar processo
   sudo kill -9 PID
   ```

2. **Container não inicia**
   ```bash
   # Ver logs detalhados
   docker-compose logs looki-app
   
   # Verificar configuração
   docker-compose config
   ```

3. **Build falha**
   ```bash
   # Limpar cache do Docker
   docker builder prune
   
   # Build sem cache
   docker-compose build --no-cache
   ```

## 📱 Acesso

Após executar com sucesso:
- **Local**: http://localhost:9090
- **VPS**: http://seu-ip-vps:9090
- **Domínio**: http://seu-dominio.com (se configurado)

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação do Docker
3. Verifique as configurações de rede e firewall