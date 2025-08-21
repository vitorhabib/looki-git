# Multi-stage build otimizado para produção em VPS

# Stage 1: Build da aplicação
FROM node:18-alpine AS builder

# Instalar dependências de sistema necessárias
RUN apk add --no-cache git python3 make g++

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache do Docker)
COPY package*.json ./
COPY bun.lockb ./

# Instalar dependências com otimizações
RUN npm ci --only=production --silent --no-audit --no-fund

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente para build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false

# Build da aplicação para produção
RUN npm run build

# Remover arquivos desnecessários
RUN rm -rf node_modules src public *.json *.js *.ts *.md

# Stage 2: Servidor Nginx otimizado para VPS
FROM nginx:1.25-alpine

# Instalar dependências para healthcheck e segurança
RUN apk add --no-cache curl tzdata

# Criar usuário nginx não-root
RUN addgroup -g 101 -S nginx
RUN adduser -S nginx -u 101 -G nginx

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Remover configurações padrão
RUN rm /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copiar arquivos buildados do stage anterior
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Criar diretórios necessários
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run

# Configurar permissões de segurança
RUN chmod -R 755 /usr/share/nginx/html
RUN find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Expor porta 80
EXPOSE 80

# Usar usuário não-root
USER nginx

# Healthcheck otimizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]