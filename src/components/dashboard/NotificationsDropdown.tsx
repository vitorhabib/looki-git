'use client';

import { Bell, AlertTriangle, Info, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationBgColor = (type: Notification['type'], read: boolean) => {
  if (read) return 'bg-muted/30';
  
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

export function NotificationsDropdown() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-accent/50 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-96 max-h-[500px]" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova(s)
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs">Você está em dia com tudo!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "p-0 cursor-pointer",
                    !notification.read && "bg-accent/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    "w-full p-3 rounded-md transition-colors",
                    getNotificationBgColor(notification.type, notification.read),
                    "hover:bg-accent/50"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium leading-tight",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          
                          {notification.actionUrl && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                            <Badge 
                              variant={notification.priority === 'high' ? 'destructive' : 
                                      notification.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {notification.priority === 'high' ? 'Alta' : 
                               notification.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => navigate('/notifications')}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}