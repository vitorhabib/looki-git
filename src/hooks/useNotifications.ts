import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, currentOrganization } = useAuth();

  const fetchNotifications = async () => {
    if (!user || !currentOrganization) return;

    try {
      setLoading(true);
      const notifications: Notification[] = [];

      // 1. Faturas vencidas
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select(`
          id, 
          total_amount, 
          due_date,
          clients(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: false })
        .limit(10);

      if (overdueInvoices && overdueInvoices.length > 0) {
        notifications.push({
          id: 'overdue-invoices',
          type: 'error',
          title: 'Faturas Vencidas',
          message: `${overdueInvoices.length} fatura(s) vencida(s) precisam de atenção`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/invoices?filter=overdue',
          priority: 'high'
        });
      }

      // 2. Faturas próximas do vencimento (próximos 7 dias)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: upcomingInvoices } = await supabase
        .from('invoices')
        .select(`
          id, 
          total_amount, 
          due_date,
          clients(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString())
        .lte('due_date', nextWeek.toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      if (upcomingInvoices && upcomingInvoices.length > 0) {
        notifications.push({
          id: 'upcoming-invoices',
          type: 'warning',
          title: 'Faturas Próximas do Vencimento',
          message: `${upcomingInvoices.length} fatura(s) vencem nos próximos 7 dias`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/invoices?filter=upcoming',
          priority: 'medium'
        });
      }

      // 3. Clientes sem atividade recente (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: inactiveClients } = await supabase
        .from('clients')
        .select(`
          id, 
          name,
          invoices!inner(created_at)
        `)
        .eq('organization_id', currentOrganization.id)
        .lt('invoices.created_at', thirtyDaysAgo.toISOString())
        .limit(5);

      if (inactiveClients && inactiveClients.length > 0) {
        notifications.push({
          id: 'inactive-clients',
          type: 'info',
          title: 'Clientes Inativos',
          message: `${inactiveClients.length} cliente(s) sem atividade há mais de 30 dias`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/clients?filter=inactive',
          priority: 'low'
        });
      }

      // 4. Despesas altas do mês atual
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', currentOrganization.id)
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (monthlyExpenses) {
        const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Alerta se despesas do mês > R$ 5000
        if (totalExpenses > 5000) {
          notifications.push({
            id: 'high-expenses',
            type: 'warning',
            title: 'Despesas Elevadas',
            message: `Despesas do mês atual: R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            timestamp: new Date(),
            read: false,
            actionUrl: '/expenses',
            priority: 'medium'
          });
        }
      }

      // 5. Faturas pagas recentemente (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentPaidInvoices } = await supabase
        .from('invoices')
        .select(`
          id, 
          total_amount,
          clients(name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('updated_at', yesterday.toISOString())
        .limit(3);

      if (recentPaidInvoices && recentPaidInvoices.length > 0) {
        const totalPaid = recentPaidInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
        notifications.push({
          id: 'recent-payments',
          type: 'success',
          title: 'Pagamentos Recebidos',
          message: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebidos nas últimas 24h`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/invoices?filter=paid',
          priority: 'low'
        });
      }

      // Ordenar por prioridade e timestamp
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      notifications.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setNotifications(notifications);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  useEffect(() => {
    fetchNotifications();
    
    // Atualizar notificações a cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, currentOrganization]);

  return {
    notifications,
    loading,
    unreadCount: getUnreadCount(),
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}