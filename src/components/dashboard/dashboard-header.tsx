'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { 
  Plus,
  User,
  LogOut,
  Shield,
  Search,
  Settings,
  Activity
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { OrganizationSelector } from "@/components/organization/OrganizationSelector";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { InvoiceModal } from "@/components/modals/InvoiceModal";
import { ClientModal } from "@/components/modals/ClientModal";
import { ExpenseModal } from "@/components/modals/ExpenseModal";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Verificar se o usuário é master admin
  useEffect(() => {
    const checkMasterAdminStatus = async () => {
      if (!user) {
        setIsMasterAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('is_master_admin', { user_uuid: user.id });
        
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







  const handleProfile = () => {
    navigate('/profile');
  };

  const handleMasterAdmin = () => {
    navigate('/master-admin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Busca",
        description: `Buscando por: ${searchQuery}`,
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'invoice':
        setIsInvoiceModalOpen(true);
        break;
      case 'client':
        setIsClientModalOpen(true);
        break;
      case 'expense':
        setIsExpenseModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout",
        description: "Saindo do sistema...",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };
  return (
    <header className="border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50 shadow-sm">
      {/* Main Header */}
      <div className="flex items-center justify-between px-6 py-5">
        {/* Left Section - Organization Selector */}
        <div className="flex items-center gap-6 flex-1">
          {/* Organization Selector */}
          <OrganizationSelector />
        </div>
        
        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar clientes, faturas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
            />
          </form>
        </div>
        
        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-3">
          
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2 bg-primary/90 hover:bg-primary shadow-md">
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickAction('invoice')}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Fatura
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('client')}>
                <User className="mr-2 h-4 w-4" />
                Novo Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('expense')}>
                <Activity className="mr-2 h-4 w-4" />
                Nova Despesa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Notifications */}
          <NotificationsDropdown />
          

          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-colors">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.user_metadata?.full_name 
                      ? user.user_metadata.full_name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
                      : user?.email?.charAt(0).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user?.user_metadata?.full_name 
                          ? user.user_metadata.full_name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
                          : user?.email?.charAt(0).toUpperCase() || 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || 'Usuário'}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  {isMasterAdmin && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Master Admin
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {isMasterAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMasterAdmin}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Painel Master</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Modals */}
      <InvoiceModal 
        open={isInvoiceModalOpen} 
        onOpenChange={setIsInvoiceModalOpen} 
      />
      <ClientModal 
        open={isClientModalOpen} 
        onOpenChange={setIsClientModalOpen} 
      />
      <ExpenseModal 
        open={isExpenseModalOpen} 
        onOpenChange={setIsExpenseModalOpen} 
      />
    </header>
  );
}