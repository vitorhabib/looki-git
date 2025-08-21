#!/bin/bash

# Script de Monitoramento para VPS
# Autor: Sistema de Monitoramento Looki
# Versão: 1.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
CONTAINER_NAME="looki-frontend-prod"
APP_PORT="9090"
LOG_DIR="/var/log/looki-nginx"
MONITOR_LOG="/var/log/looki-monitor.log"
ALERT_EMAIL="admin@seudominio.com"  # Configure seu email
MAX_CPU_USAGE=80
MAX_MEMORY_USAGE=80
MAX_DISK_USAGE=85

# Funções utilitárias
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> $MONITOR_LOG
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> $MONITOR_LOG
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> $MONITOR_LOG
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> $MONITOR_LOG
}

# Verificar se container está rodando
check_container_status() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log_success "Container $CONTAINER_NAME está rodando"
        return 0
    else
        log_error "Container $CONTAINER_NAME não está rodando!"
        return 1
    fi
}

# Verificar saúde da aplicação
check_application_health() {
    if curl -f -s http://localhost:$APP_PORT/health > /dev/null; then
        log_success "Aplicação está respondendo corretamente"
        return 0
    else
        log_error "Aplicação não está respondendo!"
        return 1
    fi
}

# Verificar uso de CPU
check_cpu_usage() {
    local cpu_usage=$(docker stats $CONTAINER_NAME --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
    local cpu_int=$(echo $cpu_usage | cut -d'.' -f1)
    
    if [ "$cpu_int" -gt "$MAX_CPU_USAGE" ]; then
        log_warning "Alto uso de CPU: ${cpu_usage}%"
        return 1
    else
        log_info "Uso de CPU: ${cpu_usage}%"
        return 0
    fi
}

# Verificar uso de memória
check_memory_usage() {
    local memory_usage=$(docker stats $CONTAINER_NAME --no-stream --format "{{.MemPerc}}" | sed 's/%//')
    local memory_int=$(echo $memory_usage | cut -d'.' -f1)
    
    if [ "$memory_int" -gt "$MAX_MEMORY_USAGE" ]; then
        log_warning "Alto uso de memória: ${memory_usage}%"
        return 1
    else
        log_info "Uso de memória: ${memory_usage}%"
        return 0
    fi
}

# Verificar uso de disco
check_disk_usage() {
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt "$MAX_DISK_USAGE" ]; then
        log_warning "Alto uso de disco: ${disk_usage}%"
        return 1
    else
        log_info "Uso de disco: ${disk_usage}%"
        return 0
    fi
}

# Verificar logs de erro
check_error_logs() {
    local error_count=$(docker logs $CONTAINER_NAME --since="1h" 2>&1 | grep -i error | wc -l)
    
    if [ "$error_count" -gt "10" ]; then
        log_warning "Muitos erros nos logs: $error_count erros na última hora"
        return 1
    else
        log_info "Logs de erro: $error_count erros na última hora"
        return 0
    fi
}

# Verificar conectividade de rede
check_network_connectivity() {
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        log_success "Conectividade de rede OK"
        return 0
    else
        log_error "Problema de conectividade de rede!"
        return 1
    fi
}

# Verificar espaço em disco dos logs
check_log_disk_usage() {
    if [ -d "$LOG_DIR" ]; then
        local log_size=$(du -sh $LOG_DIR | cut -f1)
        log_info "Tamanho dos logs: $log_size"
        
        # Limpar logs antigos se necessário (mais de 30 dias)
        find $LOG_DIR -name "*.log" -mtime +30 -delete 2>/dev/null || true
    fi
}

# Enviar alerta por email (requer mailutils configurado)
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" $ALERT_EMAIL
        log_info "Alerta enviado por email"
    else
        log_warning "Sistema de email não configurado"
    fi
}

# Reiniciar container se necessário
restart_container() {
    log_warning "Reiniciando container $CONTAINER_NAME..."
    docker restart $CONTAINER_NAME
    sleep 30
    
    if check_container_status && check_application_health; then
        log_success "Container reiniciado com sucesso"
        send_alert "Looki - Container Reiniciado" "O container $CONTAINER_NAME foi reiniciado automaticamente devido a problemas detectados."
    else
        log_error "Falha ao reiniciar container"
        send_alert "Looki - Falha Crítica" "Falha ao reiniciar o container $CONTAINER_NAME. Intervenção manual necessária."
    fi
}

# Gerar relatório de status
generate_status_report() {
    local report_file="/tmp/looki-status-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== RELATÓRIO DE STATUS - $(date) ==="
        echo
        echo "Container Status:"
        docker ps -f name=$CONTAINER_NAME
        echo
        echo "Resource Usage:"
        docker stats $CONTAINER_NAME --no-stream
        echo
        echo "Recent Logs (last 20 lines):"
        docker logs $CONTAINER_NAME --tail 20
        echo
        echo "System Resources:"
        df -h /
        free -h
        echo
        echo "Network Test:"
        ping -c 3 8.8.8.8
    } > $report_file
    
    log_info "Relatório gerado: $report_file"
    echo $report_file
}

# Monitoramento completo
full_monitoring() {
    log_info "=== INICIANDO MONITORAMENTO COMPLETO ==="
    
    local issues=0
    
    # Verificações básicas
    check_container_status || ((issues++))
    check_application_health || ((issues++))
    check_network_connectivity || ((issues++))
    
    # Verificações de recursos
    check_cpu_usage || ((issues++))
    check_memory_usage || ((issues++))
    check_disk_usage || ((issues++))
    
    # Verificações de logs
    check_error_logs || ((issues++))
    check_log_disk_usage
    
    # Ações baseadas nos problemas encontrados
    if [ $issues -gt 3 ]; then
        log_error "Muitos problemas detectados ($issues). Reiniciando container..."
        restart_container
    elif [ $issues -gt 0 ]; then
        log_warning "$issues problema(s) detectado(s)"
        send_alert "Looki - Problemas Detectados" "$issues problema(s) foram detectados no monitoramento."
    else
        log_success "Todos os checks passaram com sucesso"
    fi
    
    log_info "=== MONITORAMENTO CONCLUÍDO ==="
}

# Mostrar status atual
show_status() {
    echo "=== STATUS ATUAL ==="
    echo
    
    # Status do container
    if check_container_status; then
        echo "✅ Container Status: OK"
    else
        echo "❌ Container Status: PROBLEMA"
    fi
    
    # Status da aplicação
    if check_application_health; then
        echo "✅ Application Health: OK"
    else
        echo "❌ Application Health: PROBLEMA"
    fi
    
    # Recursos
    echo
    echo "📊 Uso de Recursos:"
    docker stats $CONTAINER_NAME --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo
    echo "💾 Disco:"
    df -h / | grep -E '(Filesystem|/)'
    
    echo
    echo "🌐 Rede:"
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        echo "✅ Conectividade: OK"
    else
        echo "❌ Conectividade: PROBLEMA"
    fi
}

# Função principal
main() {
    case "$1" in
        "status")
            show_status
            ;;
        "monitor")
            full_monitoring
            ;;
        "report")
            report_file=$(generate_status_report)
            echo "Relatório gerado: $report_file"
            ;;
        "logs")
            echo "=== LOGS RECENTES ==="
            docker logs $CONTAINER_NAME --tail 50 -f
            ;;
        "restart")
            restart_container
            ;;
        *)
            echo "Uso: $0 {status|monitor|report|logs|restart}"
            echo
            echo "Comandos:"
            echo "  status   - Mostrar status atual"
            echo "  monitor  - Executar monitoramento completo"
            echo "  report   - Gerar relatório detalhado"
            echo "  logs     - Mostrar logs em tempo real"
            echo "  restart  - Reiniciar container"
            echo
            exit 1
            ;;
    esac
}

# Criar arquivo de log se não existir
sudo touch $MONITOR_LOG
sudo chmod 666 $MONITOR_LOG

# Executar função principal
main $1