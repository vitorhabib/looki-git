#!/bin/bash

# Script de deploy para VPS
# Uso: ./deploy.sh [ambiente]
# Exemplo: ./deploy.sh prod

set -e

ENVIRONMENT=${1:-dev}
APP_NAME="looki-frontend"
PORT="9090"

echo "🚀 Iniciando deploy do $APP_NAME em ambiente: $ENVIRONMENT"

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
        exit 1
    fi
    echo "✅ Docker está rodando"
}

# Função para fazer backup do container atual
backup_current() {
    if docker ps -a --format "table {{.Names}}" | grep -q "$APP_NAME"; then
        echo "📦 Fazendo backup do container atual..."
        docker commit $APP_NAME-$ENVIRONMENT $APP_NAME-backup-$(date +%Y%m%d-%H%M%S)
        echo "✅ Backup criado"
    fi
}

# Função para parar containers existentes
stop_containers() {
    echo "🛑 Parando containers existentes..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down --remove-orphans || true
    echo "✅ Containers parados"
}

# Função para limpar imagens antigas
cleanup_images() {
    echo "🧹 Limpando imagens antigas..."
    docker image prune -f
    echo "✅ Limpeza concluída"
}

# Função para fazer build e deploy
deploy() {
    echo "🔨 Fazendo build da aplicação..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml build --no-cache
        echo "🚀 Iniciando aplicação em produção na porta $PORT..."
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose build --no-cache
        echo "🚀 Iniciando aplicação em desenvolvimento na porta $PORT..."
        docker-compose up -d
    fi
    
    echo "✅ Deploy concluído!"
}

# Função para verificar saúde da aplicação
health_check() {
    echo "🏥 Verificando saúde da aplicação..."
    sleep 10
    
    for i in {1..30}; do
        if curl -f http://localhost:$PORT > /dev/null 2>&1; then
            echo "✅ Aplicação está rodando em http://localhost:$PORT"
            return 0
        fi
        echo "⏳ Aguardando aplicação iniciar... ($i/30)"
        sleep 2
    done
    
    echo "❌ Aplicação não respondeu no tempo esperado"
    echo "📋 Logs do container:"
    docker-compose logs --tail=50
    return 1
}

# Função principal
main() {
    check_docker
    backup_current
    stop_containers
    cleanup_images
    deploy
    health_check
    
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:$PORT"
    echo "📊 Para ver logs: docker-compose logs -f"
    echo "🛑 Para parar: docker-compose down"
}

# Executar função principal
main