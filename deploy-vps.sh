#!/bin/bash

# Script de Deploy Automatizado para VPS
# Autor: Sistema de Deploy Looki
# Versão: 2.0

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="looki-frontend"
CONTAINER_NAME="looki-frontend-prod"
IMAGE_NAME="looki-frontend:latest"
PORT="9090"
DOMAIN="seudominio.com"  # Altere para seu domínio
BACKUP_DIR="/var/backups/looki"
LOG_DIR="/var/log/looki-nginx"

# Funções utilitárias
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado e rodando
check_docker() {
    log_info "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker não está instalado!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker não está rodando!"
        exit 1
    fi
    
    log_success "Docker está funcionando"
}

# Verificar se Docker Compose está instalado
check_docker_compose() {
    log_info "Verificando Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose não está instalado!"
        exit 1
    fi
    
    log_success "Docker Compose está disponível"
}

# Criar diretórios necessários
setup_directories() {
    log_info "Criando diretórios necessários..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p /var/www/certbot
    
    # Configurar permissões
    sudo chown -R $USER:$USER $BACKUP_DIR
    sudo chmod 755 $LOG_DIR
    
    log_success "Diretórios criados com sucesso"
}

# Fazer backup do container atual
backup_current_deployment() {
    log_info "Fazendo backup do deployment atual..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        # Fazer backup dos logs
        if [ -d "$LOG_DIR" ]; then
            sudo tar -czf $BACKUP_FILE -C $LOG_DIR . 2>/dev/null || true
            log_success "Backup criado: $BACKUP_FILE"
        fi
        
        # Manter apenas os últimos 5 backups
        cd $BACKUP_DIR
        ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    else
        log_warning "Nenhum container em execução para fazer backup"
    fi
}

# Parar e remover containers existentes
stop_existing_containers() {
    log_info "Parando containers existentes..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        log_success "Container parado"
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        docker rm $CONTAINER_NAME
        log_success "Container removido"
    fi
}

# Limpar imagens antigas
cleanup_old_images() {
    log_info "Limpando imagens antigas..."
    
    # Remover imagens não utilizadas
    docker image prune -f
    
    # Remover volumes não utilizados
    docker volume prune -f
    
    log_success "Limpeza concluída"
}

# Verificar arquivo de ambiente
check_env_file() {
    log_info "Verificando arquivo de ambiente..."
    
    if [ ! -f ".env.production" ]; then
        log_error "Arquivo .env.production não encontrado!"
        log_info "Criando arquivo .env.production de exemplo..."
        cp .env.example .env.production
        log_warning "Configure o arquivo .env.production antes de continuar"
        exit 1
    fi
    
    log_success "Arquivo de ambiente encontrado"
}

# Build da aplicação
build_application() {
    log_info "Fazendo build da aplicação..."
    
    # Build com cache otimizado
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log_success "Build concluído com sucesso"
}

# Deploy da aplicação
deploy_application() {
    log_info "Fazendo deploy da aplicação..."
    
    # Subir os serviços
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Deploy concluído"
}

# Verificar saúde da aplicação
health_check() {
    log_info "Verificando saúde da aplicação..."
    
    # Aguardar container inicializar
    sleep 30
    
    # Verificar se container está rodando
    if ! docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log_error "Container não está rodando!"
        return 1
    fi
    
    # Verificar endpoint de saúde
    for i in {1..10}; do
        if curl -f http://localhost:$PORT/health &> /dev/null; then
            log_success "Aplicação está saudável"
            return 0
        fi
        log_info "Tentativa $i/10 - Aguardando aplicação..."
        sleep 10
    done
    
    log_error "Aplicação não respondeu ao health check"
    return 1
}

# Configurar SSL com Let's Encrypt (opcional)
setup_ssl() {
    if [ "$1" = "--ssl" ]; then
        log_info "Configurando SSL com Let's Encrypt..."
        
        # Instalar certbot se não estiver instalado
        if ! command -v certbot &> /dev/null; then
            log_info "Instalando certbot..."
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Obter certificado
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Configurar renovação automática
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log_success "SSL configurado com sucesso"
    fi
}

# Mostrar informações do deploy
show_deploy_info() {
    log_success "=== DEPLOY CONCLUÍDO COM SUCESSO ==="
    echo
    log_info "Informações do Deploy:"
    echo "  • Aplicação: $APP_NAME"
    echo "  • Container: $CONTAINER_NAME"
    echo "  • Porta: $PORT"
    echo "  • URL: http://localhost:$PORT"
    if [ "$1" = "--ssl" ]; then
        echo "  • URL HTTPS: https://$DOMAIN"
    fi
    echo
    log_info "Comandos úteis:"
    echo "  • Ver logs: docker logs $CONTAINER_NAME -f"
    echo "  • Status: docker ps | grep $CONTAINER_NAME"
    echo "  • Parar: docker stop $CONTAINER_NAME"
    echo "  • Reiniciar: docker restart $CONTAINER_NAME"
    echo
}

# Função principal
main() {
    log_info "=== INICIANDO DEPLOY PARA VPS ==="
    echo
    
    # Verificações iniciais
    check_docker
    check_docker_compose
    check_env_file
    
    # Preparação
    setup_directories
    backup_current_deployment
    stop_existing_containers
    cleanup_old_images
    
    # Deploy
    build_application
    deploy_application
    
    # Verificação
    if health_check; then
        setup_ssl $1
        show_deploy_info $1
    else
        log_error "Deploy falhou no health check!"
        log_info "Verificando logs..."
        docker logs $CONTAINER_NAME --tail 50
        exit 1
    fi
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [--ssl]"
    echo
    echo "Opções:"
    echo "  --ssl    Configurar SSL com Let's Encrypt"
    echo "  --help   Mostrar esta ajuda"
    echo
    exit 0
fi

# Executar deploy
main $1