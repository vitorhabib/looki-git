'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  TrendingUp, 
  Settings,
  CreditCard,
  FolderKanban,
  Building2,
  ChevronLeft,
  Menu,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: Users
  },
  {
    name: 'Cobranças',
    href: '/invoices',
    icon: FileText
  },
  {
    name: 'Despesas',
    href: '/expenses',
    icon: Receipt
  },
  {
    name: 'Categorias',
    href: '/categories',
    icon: FolderKanban
  },
  {
    name: 'Projeções',
    href: '/forecast',
    icon: TrendingUp
  }
];

const bottomNavigation = [
  {
    name: 'Assinatura',
    href: '/billing',
    icon: CreditCard
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings
  }
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentOrganization } = useAuth();

  // Verificar se o usuário é master admin
  useEffect(() => {
    const checkMasterAdminStatus = async () => {
      if (!user) {
        setIsMasterAdmin(false);
        return;
      }
      
      try {
        // Usar a função is_master_admin do Supabase
        const { data, error } = await supabase.rpc('is_master_admin', { user_uuid: user.id });
        
        if (error) {
          console.error('Erro ao verificar status de master admin:', error);
          setIsMasterAdmin(false);
          return;
        }
        
        setIsMasterAdmin(data || false);
      } catch (error) {
        console.error('Erro ao verificar status de master admin:', error);
        setIsMasterAdmin(false);
      }
    };

    checkMasterAdminStatus();
  }, [user]);

  const isCurrentPath = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname.endsWith('/org/demo');
    }
    return location.pathname.includes(href);
  };

  return (
    <div className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border",
        collapsed ? "justify-center p-4" : "justify-between p-6"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-sidebar-primary" />
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Looki</h1>
              <p className="text-xs text-sidebar-foreground/70">{currentOrganization?.name || 'Organização'}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
            collapsed && "h-10 w-10 p-0 flex items-center justify-center"
          )}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isCurrent = isCurrentPath(item.href);
          return (
            <Button
              key={item.name}
              variant={isCurrent ? "default" : "ghost"}
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full justify-start gap-3 h-10',
                isCurrent 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Button>
          );
        })}
        
        {/* Master Admin Button - Only visible for master admins */}
        {isMasterAdmin && (
          <Button
            variant={isCurrentPath('/master-admin') ? "default" : "ghost"}
            onClick={() => navigate('/master-admin')}
            className={cn(
              'w-full justify-start gap-3 h-10',
              isCurrentPath('/master-admin')
                ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'px-2'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Administrador Master</span>}
          </Button>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const isCurrent = isCurrentPath(item.href);
          return (
            <Button
              key={item.name}
              variant={isCurrent ? "default" : "ghost"}
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full justify-start gap-3 h-10',
                isCurrent
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Button>
          );
        })}
      </div>
    </div>
  );
}