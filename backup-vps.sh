#!/bin/bash

# Script de Backup e Recuperação para VPS
# Autor: Sistema de Backup Looki
# Versão: 1.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
APP_NAME="looki-frontend"
CONTAINER_NAME="looki-frontend-prod"
BACKUP_DIR="/var/backups/looki"
DAILY_BACKUP_DIR="$BACKUP_DIR/daily"
WEEKLY_BACKUP_DIR="$BACKUP_DIR/weekly"
MONTHLY_BACKUP_DIR="$BACKUP_DIR/monthly"
APP_DIR="/opt/looki-frontend"
LOG_DIR="/var/log/looki-nginx"
BACKUP_LOG="/var/log/looki-backup.log"
MAX_DAILY_BACKUPS=7
MAX_WEEKLY_BACKUPS=4
MAX_MONTHLY_BACKUPS=12

# Configurações de armazenamento remoto (opcional)
# AWS_BUCKET="your-backup-bucket"
# AWS_REGION="us-east-1"
# REMOTE_BACKUP_ENABLED=false

# Funções utilitárias
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> $BACKUP_LOG
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> $BACKUP_LOG
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> $BACKUP_LOG
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> $BACKUP_LOG
}

# Criar diretórios de backup
setup_backup_directories() {
    log_info "Configurando diretórios de backup..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p $DAILY_BACKUP_DIR
    sudo mkdir -p $WEEKLY_BACKUP_DIR
    sudo mkdir -p $MONTHLY_BACKUP_DIR
    
    sudo chown -R $USER:$USER $BACKUP_DIR
    sudo chmod -R 755 $BACKUP_DIR
    
    log_success "Diretórios de backup configurados"
}

# Verificar espaço em disco
check_disk_space() {
    local required_space_gb=$1
    local available_space_gb=$(df $BACKUP_DIR | awk 'NR==2 {print int($4/1024/1024)}')
    
    if [ $available_space_gb -lt $required_space_gb ]; then
        log_error "Espaço insuficiente. Necessário: ${required_space_gb}GB, Disponível: ${available_space_gb}GB"
        return 1
    else
        log_info "Espaço em disco OK: ${available_space_gb}GB disponível"
        return 0
    fi
}

# Backup da aplicação
backup_application() {
    local backup_type=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${APP_NAME}_${backup_type}_${timestamp}"
    local backup_path=""
    
    case $backup_type in
        "daily")
            backup_path="$DAILY_BACKUP_DIR/$backup_name.tar.gz"
            ;;
        "weekly")
            backup_path="$WEEKLY_BACKUP_DIR/$backup_name.tar.gz"
            ;;
        "monthly")
            backup_path="$MONTHLY_BACKUP_DIR/$backup_name.tar.gz"
            ;;
        *)
            backup_path="$BACKUP_DIR/$backup_name.tar.gz"
            ;;
    esac
    
    log_info "Iniciando backup $backup_type: $backup_name"
    
    # Verificar espaço em disco (estimativa de 2GB necessários)
    if ! check_disk_space 2; then
        return 1
    fi
    
    # Criar backup da aplicação
    if [ -d "$APP_DIR" ]; then
        log_info "Fazendo backup dos arquivos da aplicação..."
        tar -czf "$backup_path" \
            -C "$(dirname $APP_DIR)" \
            "$(basename $APP_DIR)" \
            --exclude="node_modules" \
            --exclude=".git" \
            --exclude="*.log" \
            2>/dev/null || {
            log_error "Falha no backup dos arquivos da aplicação"
            return 1
        }
    else
        log_warning "Diretório da aplicação não encontrado: $APP_DIR"
    fi
    
    # Adicionar configurações do Docker
    if [ -f "$APP_DIR/docker-compose.prod.yml" ]; then
        log_info "Adicionando configurações Docker ao backup..."
        tar -rf "${backup_path%.gz}" \
            -C "$APP_DIR" \
            docker-compose.prod.yml \
            Dockerfile \
            nginx.conf \
            nginx-ssl.conf \
            .env.production \
            2>/dev/null || true
        
        gzip "${backup_path%.gz}"
    fi
    
    # Adicionar logs se existirem
    if [ -d "$LOG_DIR" ]; then
        log_info "Adicionando logs ao backup..."
        tar -rf "${backup_path%.gz}" \
            -C "$(dirname $LOG_DIR)" \
            "$(basename $LOG_DIR)" \
            2>/dev/null || true
        
        gzip "${backup_path%.gz}"
    fi
    
    # Verificar se o backup foi criado com sucesso
    if [ -f "$backup_path" ]; then
        local backup_size=$(du -h "$backup_path" | cut -f1)
        log_success "Backup criado com sucesso: $backup_path ($backup_size)"
        
        # Criar arquivo de metadados
        create_backup_metadata "$backup_path" "$backup_type" "$timestamp"
        
        return 0
    else
        log_error "Falha ao criar backup: $backup_path"
        return 1
    fi
}

# Criar metadados do backup
create_backup_metadata() {
    local backup_path=$1
    local backup_type=$2
    local timestamp=$3
    local metadata_file="${backup_path}.meta"
    
    {
        echo "backup_file=$(basename $backup_path)"
        echo "backup_type=$backup_type"
        echo "timestamp=$timestamp"
        echo "created_date=$(date '+%Y-%m-%d %H:%M:%S')"
        echo "backup_size=$(du -h $backup_path | cut -f1)"
        echo "app_version=$(docker image inspect $CONTAINER_NAME:latest --format '{{.Id}}' 2>/dev/null || echo 'unknown')"
        echo "system_info=$(uname -a)"
        echo "docker_version=$(docker --version)"
    } > "$metadata_file"
    
    log_info "Metadados criados: $metadata_file"
}

# Backup do banco de dados (se aplicável)
backup_database() {
    log_info "Verificando se há banco de dados para backup..."
    
    # Como é uma aplicação frontend, provavelmente não há banco local
    # Mas podemos fazer backup das configurações do Supabase
    if [ -f "$APP_DIR/.env.production" ]; then
        local db_backup_dir="$BACKUP_DIR/database"
        mkdir -p "$db_backup_dir"
        
        # Backup das configurações (sem as chaves secretas)
        grep -v "ANON_KEY\|SERVICE_KEY" "$APP_DIR/.env.production" > "$db_backup_dir/supabase_config_$(date +%Y%m%d).env" 2>/dev/null || true
        
        log_info "Configurações do banco salvas (sem chaves secretas)"
    fi
}

# Limpeza de backups antigos
cleanup_old_backups() {
    log_info "Limpando backups antigos..."
    
    # Limpar backups diários antigos
    if [ -d "$DAILY_BACKUP_DIR" ]; then
        local daily_count=$(ls -1 $DAILY_BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)
        if [ $daily_count -gt $MAX_DAILY_BACKUPS ]; then
            ls -1t $DAILY_BACKUP_DIR/*.tar.gz | tail -n +$((MAX_DAILY_BACKUPS + 1)) | xargs rm -f
            ls -1t $DAILY_BACKUP_DIR/*.meta 2>/dev/null | tail -n +$((MAX_DAILY_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
            log_info "Backups diários antigos removidos"
        fi
    fi
    
    # Limpar backups semanais antigos
    if [ -d "$WEEKLY_BACKUP_DIR" ]; then
        local weekly_count=$(ls -1 $WEEKLY_BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)
        if [ $weekly_count -gt $MAX_WEEKLY_BACKUPS ]; then
            ls -1t $WEEKLY_BACKUP_DIR/*.tar.gz | tail -n +$((MAX_WEEKLY_BACKUPS + 1)) | xargs rm -f
            ls -1t $WEEKLY_BACKUP_DIR/*.meta 2>/dev/null | tail -n +$((MAX_WEEKLY_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
            log_info "Backups semanais antigos removidos"
        fi
    fi
    
    # Limpar backups mensais antigos
    if [ -d "$MONTHLY_BACKUP_DIR" ]; then
        local monthly_count=$(ls -1 $MONTHLY_BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)
        if [ $monthly_count -gt $MAX_MONTHLY_BACKUPS ]; then
            ls -1t $MONTHLY_BACKUP_DIR/*.tar.gz | tail -n +$((MAX_MONTHLY_BACKUPS + 1)) | xargs rm -f
            ls -1t $MONTHLY_BACKUP_DIR/*.meta 2>/dev/null | tail -n +$((MAX_MONTHLY_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
            log_info "Backups mensais antigos removidos"
        fi
    fi
}

# Listar backups disponíveis
list_backups() {
    echo "=== BACKUPS DISPONÍVEIS ==="
    echo
    
    echo "📅 Backups Diários:"
    if [ -d "$DAILY_BACKUP_DIR" ] && [ "$(ls -A $DAILY_BACKUP_DIR/*.tar.gz 2>/dev/null)" ]; then
        ls -lh $DAILY_BACKUP_DIR/*.tar.gz | awk '{print "  " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'  | sed 's|.*/||'
    else
        echo "  Nenhum backup diário encontrado"
    fi
    
    echo
    echo "📅 Backups Semanais:"
    if [ -d "$WEEKLY_BACKUP_DIR" ] && [ "$(ls -A $WEEKLY_BACKUP_DIR/*.tar.gz 2>/dev/null)" ]; then
        ls -lh $WEEKLY_BACKUP_DIR/*.tar.gz | awk '{print "  " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'  | sed 's|.*/||'
    else
        echo "  Nenhum backup semanal encontrado"
    fi
    
    echo
    echo "📅 Backups Mensais:"
    if [ -d "$MONTHLY_BACKUP_DIR" ] && [ "$(ls -A $MONTHLY_BACKUP_DIR/*.tar.gz 2>/dev/null)" ]; then
        ls -lh $MONTHLY_BACKUP_DIR/*.tar.gz | awk '{print "  " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'  | sed 's|.*/||'
    else
        echo "  Nenhum backup mensal encontrado"
    fi
    
    echo
    echo "💾 Espaço usado pelos backups:"
    if [ -d "$BACKUP_DIR" ]; then
        du -sh $BACKUP_DIR
    fi
}

# Restaurar backup
restore_backup() {
    local backup_file=$1
    local restore_dir="/tmp/looki-restore-$(date +%Y%m%d_%H%M%S)"
    
    if [ -z "$backup_file" ]; then
        log_error "Nome do arquivo de backup não especificado"
        echo "Uso: $0 restore <nome_do_backup.tar.gz>"
        list_backups
        return 1
    fi
    
    # Procurar o arquivo de backup
    local backup_path=""
    for dir in "$DAILY_BACKUP_DIR" "$WEEKLY_BACKUP_DIR" "$MONTHLY_BACKUP_DIR" "$BACKUP_DIR"; do
        if [ -f "$dir/$backup_file" ]; then
            backup_path="$dir/$backup_file"
            break
        fi
    done
    
    if [ -z "$backup_path" ]; then
        log_error "Arquivo de backup não encontrado: $backup_file"
        list_backups
        return 1
    fi
    
    log_info "Iniciando restauração do backup: $backup_path"
    
    # Criar diretório temporário para restauração
    mkdir -p "$restore_dir"
    
    # Extrair backup
    log_info "Extraindo backup..."
    if tar -xzf "$backup_path" -C "$restore_dir"; then
        log_success "Backup extraído com sucesso em: $restore_dir"
    else
        log_error "Falha ao extrair backup"
        rm -rf "$restore_dir"
        return 1
    fi
    
    # Mostrar conteúdo extraído
    echo
    echo "=== CONTEÚDO DO BACKUP ==="
    ls -la "$restore_dir"
    echo
    
    # Perguntar se deseja continuar com a restauração
    read -p "Deseja continuar com a restauração? Isso irá parar a aplicação atual. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restauração cancelada pelo usuário"
        rm -rf "$restore_dir"
        return 0
    fi
    
    # Parar container atual
    log_info "Parando container atual..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    
    # Fazer backup da configuração atual
    if [ -d "$APP_DIR" ]; then
        local current_backup="$BACKUP_DIR/pre-restore-$(date +%Y%m%d_%H%M%S).tar.gz"
        log_info "Fazendo backup da configuração atual..."
        tar -czf "$current_backup" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)" 2>/dev/null || true
        log_info "Backup atual salvo em: $current_backup"
    fi
    
    # Restaurar arquivos
    log_info "Restaurando arquivos..."
    sudo rm -rf "$APP_DIR" 2>/dev/null || true
    sudo mkdir -p "$(dirname $APP_DIR)"
    sudo mv "$restore_dir/$(basename $APP_DIR)" "$APP_DIR" 2>/dev/null || {
        # Se a estrutura for diferente, tentar mover o conteúdo
        sudo mv "$restore_dir"/* "$APP_DIR/" 2>/dev/null || true
    }
    
    # Ajustar permissões
    sudo chown -R $USER:$USER "$APP_DIR"
    
    # Reconstruir e iniciar aplicação
    log_info "Reconstruindo aplicação..."
    cd "$APP_DIR"
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml build
        docker-compose -f docker-compose.prod.yml up -d
        
        # Aguardar inicialização
        sleep 30
        
        # Verificar se a aplicação está funcionando
        if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
            log_success "Restauração concluída com sucesso!"
        else
            log_error "Aplicação não iniciou corretamente após restauração"
        fi
    else
        log_warning "Arquivo docker-compose.prod.yml não encontrado. Restauração manual necessária."
    fi
    
    # Limpar diretório temporário
    rm -rf "$restore_dir"
    
    log_info "Processo de restauração finalizado"
}

# Função principal
main() {
    case "$1" in
        "setup")
            setup_backup_directories
            ;;
        "daily")
            setup_backup_directories
            backup_application "daily"
            backup_database
            cleanup_old_backups
            ;;
        "weekly")
            setup_backup_directories
            backup_application "weekly"
            backup_database
            cleanup_old_backups
            ;;
        "monthly")
            setup_backup_directories
            backup_application "monthly"
            backup_database
            cleanup_old_backups
            ;;
        "list")
            list_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Uso: $0 {setup|daily|weekly|monthly|list|restore|cleanup}"
            echo
            echo "Comandos:"
            echo "  setup    - Configurar diretórios de backup"
            echo "  daily    - Executar backup diário"
            echo "  weekly   - Executar backup semanal"
            echo "  monthly  - Executar backup mensal"
            echo "  list     - Listar backups disponíveis"
            echo "  restore  - Restaurar backup específico"
            echo "  cleanup  - Limpar backups antigos"
            echo
            echo "Exemplos:"
            echo "  $0 daily"
            echo "  $0 restore looki-frontend_daily_20240115_143022.tar.gz"
            echo
            exit 1
            ;;
    esac
}

# Criar arquivo de log se não existir
sudo touch $BACKUP_LOG
sudo chmod 666 $BACKUP_LOG

# Executar função principal
main $1 $2