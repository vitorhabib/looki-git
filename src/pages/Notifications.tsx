'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Filter, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationBgColor = (type: Notification['type'], read: boolean) => {
  if (read) return '';
  
  switch (type) {
    case 'error':
      return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500';
    case 'info':
      return 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500';
    case 'success':
      return 'bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500';
    default:
      return 'bg-muted/50';
  }
};

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'unread':
        return !notification.read && matchesSearch;
      case 'high':
        return notification.priority === 'high' && matchesSearch;
      case 'medium':
        return notification.priority === 'medium' && matchesSearch;
      case 'low':
        return notification.priority === 'low' && matchesSearch;
      default:
        return matchesSearch;
    }
  });

  const unreadNotifications = notifications.filter(n => !n.read);
  const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
  const mediumPriorityNotifications = notifications.filter(n => n.priority === 'medium');
  const lowPriorityNotifications = notifications.filter(n => n.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas notificações e alertas do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              Marcar todas como lidas
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={markAllAsRead}>
                Marcar todas como lidas
              </DropdownMenuItem>
              <DropdownMenuItem>
                Configurar notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Todas as notificações
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <div className="h-4 w-4 bg-primary rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Urgentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média/Baixa</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediumPriorityNotifications.length + lowPriorityNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Informativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar notificações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Notifications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não Lidas ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="high">
            Alta ({highPriorityNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="medium">
            Média ({mediumPriorityNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="low">
            Baixa ({lowPriorityNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Carregando notificações...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma notificação encontrada</h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery ? 'Tente ajustar os filtros de busca.' : 'Você está em dia com tudo!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    getNotificationBgColor(notification.type, notification.read),
                    !notification.read && "ring-2 ring-primary/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={cn(
                              "font-medium text-sm leading-tight mb-1",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                            <Badge 
                              variant={notification.priority === 'high' ? 'destructive' : 
                                      notification.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {notification.priority === 'high' ? 'Alta' : 
                               notification.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {format(notification.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span>
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}