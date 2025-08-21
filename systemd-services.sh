#!/bin/bash

# Script para configurar serviços systemd para Looki
# Autor: Sistema de Automação Looki
# Versão: 1.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
APP_DIR="/opt/looki-frontend"
SCRIPT_DIR="$APP_DIR"
USER="$(whoami)"
GROUP="$(id -gn)"

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

# Criar serviço de backup diário
create_backup_service() {
    log_info "Criando serviço de backup diário..."
    
    sudo tee /etc/systemd/system/looki-backup.service > /dev/null <<EOF
[Unit]
Description=Looki Frontend Daily Backup
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
Group=$GROUP
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPT_DIR/backup-vps.sh daily
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço de backup criado: /etc/systemd/system/looki-backup.service"
}

# Criar timer para backup diário
create_backup_timer() {
    log_info "Criando timer para backup diário..."
    
    sudo tee /etc/systemd/system/looki-backup.timer > /dev/null <<EOF
[Unit]
Description=Run Looki backup daily at 2 AM
Requires=looki-backup.service

[Timer]
OnCalendar=daily
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

    log_success "Timer de backup criado: /etc/systemd/system/looki-backup.timer"
}

# Criar serviço de backup semanal
create_weekly_backup_service() {
    log_info "Criando serviço de backup semanal..."
    
    sudo tee /etc/systemd/system/looki-backup-weekly.service > /dev/null <<EOF
[Unit]
Description=Looki Frontend Weekly Backup
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
Group=$GROUP
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPT_DIR/backup-vps.sh weekly
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço de backup semanal criado: /etc/systemd/system/looki-backup-weekly.service"
}

# Criar timer para backup semanal
create_weekly_backup_timer() {
    log_info "Criando timer para backup semanal..."
    
    sudo tee /etc/systemd/system/looki-backup-weekly.timer > /dev/null <<EOF
[Unit]
Description=Run Looki weekly backup on Sundays at 3 AM
Requires=looki-backup-weekly.service

[Timer]
OnCalendar=Sun *-*-* 03:00:00
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

    log_success "Timer de backup semanal criado: /etc/systemd/system/looki-backup-weekly.timer"
}

# Criar serviço de backup mensal
create_monthly_backup_service() {
    log_info "Criando serviço de backup mensal..."
    
    sudo tee /etc/systemd/system/looki-backup-monthly.service > /dev/null <<EOF
[Unit]
Description=Looki Frontend Monthly Backup
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
Group=$GROUP
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPT_DIR/backup-vps.sh monthly
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço de backup mensal criado: /etc/systemd/system/looki-backup-monthly.service"
}

# Criar timer para backup mensal
create_monthly_backup_timer() {
    log_info "Criando timer para backup mensal..."
    
    sudo tee /etc/systemd/system/looki-backup-monthly.timer > /dev/null <<EOF
[Unit]
Description=Run Looki monthly backup on the 1st day of each month at 4 AM
Requires=looki-backup-monthly.service

[Timer]
OnCalendar=*-*-01 04:00:00
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

    log_success "Timer de backup mensal criado: /etc/systemd/system/looki-backup-monthly.timer"
}

# Criar serviço de monitoramento
create_monitoring_service() {
    log_info "Criando serviço de monitoramento..."
    
    sudo tee /etc/systemd/system/looki-monitor.service > /dev/null <<EOF
[Unit]
Description=Looki Frontend Monitoring
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$USER
Group=$GROUP
WorkingDirectory=$APP_DIR
ExecStart=$SCRIPT_DIR/monitor-vps.sh monitor
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço de monitoramento criado: /etc/systemd/system/looki-monitor.service"
}

# Criar timer para monitoramento
create_monitoring_timer() {
    log_info "Criando timer para monitoramento..."
    
    sudo tee /etc/systemd/system/looki-monitor.timer > /dev/null <<EOF
[Unit]
Description=Run Looki monitoring every 15 minutes
Requires=looki-monitor.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
Persistent=true
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

    log_success "Timer de monitoramento criado: /etc/systemd/system/looki-monitor.timer"
}

# Criar serviço principal da aplicação
create_app_service() {
    log_info "Criando serviço principal da aplicação..."
    
    sudo tee /etc/systemd/system/looki-app.service > /dev/null <<EOF
[Unit]
Description=Looki Frontend Application
After=network.target docker.service
Requires=docker.service
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=forking
User=$USER
Group=$GROUP
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
ExecReload=/usr/bin/docker-compose -f docker-compose.prod.yml restart
Restart=always
RestartSec=10
TimeoutStartSec=300
TimeoutStopSec=120
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço da aplicação criado: /etc/systemd/system/looki-app.service"
}

# Criar serviço de limpeza de logs
create_log_cleanup_service() {
    log_info "Criando serviço de limpeza de logs..."
    
    sudo tee /etc/systemd/system/looki-log-cleanup.service > /dev/null <<EOF
[Unit]
Description=Looki Log Cleanup Service
After=network.target

[Service]
Type=oneshot
User=root
ExecStart=/bin/bash -c 'find /var/log/looki-nginx -name "*.log" -mtime +30 -delete; find /var/log -name "looki-*.log" -mtime +30 -delete; docker system prune -f --filter "until=720h"'
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    log_success "Serviço de limpeza de logs criado: /etc/systemd/system/looki-log-cleanup.service"
}

# Criar timer para limpeza de logs
create_log_cleanup_timer() {
    log_info "Criando timer para limpeza de logs..."
    
    sudo tee /etc/systemd/system/looki-log-cleanup.timer > /dev/null <<EOF
[Unit]
Description=Run Looki log cleanup weekly
Requires=looki-log-cleanup.service

[Timer]
OnCalendar=weekly
Persistent=true
AccuracySec=1h

[Install]
WantedBy=timers.target
EOF

    log_success "Timer de limpeza de logs criado: /etc/systemd/system/looki-log-cleanup.timer"
}

# Habilitar e iniciar serviços
enable_and_start_services() {
    log_info "Recarregando daemon do systemd..."
    sudo systemctl daemon-reload
    
    log_info "Habilitando e iniciando serviços..."
    
    # Habilitar timers de backup
    sudo systemctl enable looki-backup.timer
    sudo systemctl start looki-backup.timer
    log_success "Timer de backup diário habilitado"
    
    sudo systemctl enable looki-backup-weekly.timer
    sudo systemctl start looki-backup-weekly.timer
    log_success "Timer de backup semanal habilitado"
    
    sudo systemctl enable looki-backup-monthly.timer
    sudo systemctl start looki-backup-monthly.timer
    log_success "Timer de backup mensal habilitado"
    
    # Habilitar timer de monitoramento
    sudo systemctl enable looki-monitor.timer
    sudo systemctl start looki-monitor.timer
    log_success "Timer de monitoramento habilitado"
    
    # Habilitar timer de limpeza
    sudo systemctl enable looki-log-cleanup.timer
    sudo systemctl start looki-log-cleanup.timer
    log_success "Timer de limpeza de logs habilitado"
    
    # Habilitar serviço da aplicação
    sudo systemctl enable looki-app.service
    log_success "Serviço da aplicação habilitado"
    
    log_success "Todos os serviços foram configurados e habilitados!"
}

# Mostrar status dos serviços
show_services_status() {
    echo "=== STATUS DOS SERVIÇOS LOOKI ==="
    echo
    
    echo "🔄 Serviços:"
    sudo systemctl status looki-app.service --no-pager -l || true
    echo
    
    echo "⏰ Timers:"
    sudo systemctl list-timers looki-* --no-pager
    echo
    
    echo "📊 Últimas execuções:"
    echo "Backup diário:"
    sudo systemctl status looki-backup.service --no-pager -l | head -10 || true
    echo
    echo "Monitoramento:"
    sudo systemctl status looki-monitor.service --no-pager -l | head -10 || true
    echo
}

# Parar todos os serviços
stop_all_services() {
    log_info "Parando todos os serviços Looki..."
    
    sudo systemctl stop looki-backup.timer || true
    sudo systemctl stop looki-backup-weekly.timer || true
    sudo systemctl stop looki-backup-monthly.timer || true
    sudo systemctl stop looki-monitor.timer || true
    sudo systemctl stop looki-log-cleanup.timer || true
    sudo systemctl stop looki-app.service || true
    
    log_success "Todos os serviços foram parados"
}

# Remover todos os serviços
remove_all_services() {
    log_info "Removendo todos os serviços Looki..."
    
    # Parar serviços primeiro
    stop_all_services
    
    # Desabilitar serviços
    sudo systemctl disable looki-backup.timer || true
    sudo systemctl disable looki-backup-weekly.timer || true
    sudo systemctl disable looki-backup-monthly.timer || true
    sudo systemctl disable looki-monitor.timer || true
    sudo systemctl disable looki-log-cleanup.timer || true
    sudo systemctl disable looki-app.service || true
    
    # Remover arquivos de serviço
    sudo rm -f /etc/systemd/system/looki-*.service
    sudo rm -f /etc/systemd/system/looki-*.timer
    
    # Recarregar daemon
    sudo systemctl daemon-reload
    
    log_success "Todos os serviços foram removidos"
}

# Criar arquivo de configuração do logrotate
create_logrotate_config() {
    log_info "Criando configuração do logrotate..."
    
    sudo tee /etc/logrotate.d/looki > /dev/null <<EOF
/var/log/looki-nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker exec looki-frontend-prod nginx -s reload 2>/dev/null || true
    endscript
}

/var/log/looki-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $GROUP
}
EOF

    log_success "Configuração do logrotate criada: /etc/logrotate.d/looki"
}

# Função principal
main() {
    case "$1" in
        "install")
            create_backup_service
            create_backup_timer
            create_weekly_backup_service
            create_weekly_backup_timer
            create_monthly_backup_service
            create_monthly_backup_timer
            create_monitoring_service
            create_monitoring_timer
            create_app_service
            create_log_cleanup_service
            create_log_cleanup_timer
            create_logrotate_config
            enable_and_start_services
            ;;
        "status")
            show_services_status
            ;;
        "stop")
            stop_all_services
            ;;
        "start")
            enable_and_start_services
            ;;
        "remove")
            remove_all_services
            ;;
        "logs")
            echo "=== LOGS DOS SERVIÇOS ==="
            echo
            echo "Logs do backup:"
            sudo journalctl -u looki-backup.service -n 20 --no-pager
            echo
            echo "Logs do monitoramento:"
            sudo journalctl -u looki-monitor.service -n 20 --no-pager
            ;;
        *)
            echo "Uso: $0 {install|status|start|stop|remove|logs}"
            echo
            echo "Comandos:"
            echo "  install  - Instalar e configurar todos os serviços"
            echo "  status   - Mostrar status dos serviços"
            echo "  start    - Iniciar todos os serviços"
            echo "  stop     - Parar todos os serviços"
            echo "  remove   - Remover todos os serviços"
            echo "  logs     - Mostrar logs dos serviços"
            echo
            echo "Serviços que serão criados:"
            echo "  - looki-app.service (aplicação principal)"
            echo "  - looki-backup.timer (backup diário às 2h)"
            echo "  - looki-backup-weekly.timer (backup semanal aos domingos às 3h)"
            echo "  - looki-backup-monthly.timer (backup mensal no dia 1 às 4h)"
            echo "  - looki-monitor.timer (monitoramento a cada 15 minutos)"
            echo "  - looki-log-cleanup.timer (limpeza semanal de logs)"
            echo
            exit 1
            ;;
    esac
}

# Verificar se está rodando como usuário com sudo
if [ "$EUID" -eq 0 ]; then
    log_error "Não execute este script como root. Use um usuário com privilégios sudo."
    exit 1
fi

# Verificar se sudo está disponível
if ! command -v sudo &> /dev/null; then
    log_error "sudo não está instalado. Instale sudo primeiro."
    exit 1
fi

# Executar função principal
main $1