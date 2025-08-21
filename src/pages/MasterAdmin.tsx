import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Edit, Eye, Building2, Users, Shield, DollarSign, FileText, UserPlus, Pause, Trash2, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { OrganizationModal } from '@/components/master-admin/OrganizationModal';
import { UserModal } from '@/components/master-admin/UserModal';
import FinancialReports from '@/components/master-admin/FinancialReports';
import SupportSystem from '@/components/master-admin/SupportSystem';
import { DebugPanel } from '@/components/admin/DebugPanel';

interface SaasStats {
  total_organizations: number;
  total_users: number;
  total_clients: number;
  total_invoices: number;
  total_expenses: number;
  total_master_admins: number;
  total_revenue: number;
  total_expenses_amount: number;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  is_active: boolean;
  user_count?: number;
  invoice_count?: number;
  total_revenue?: number;
}

interface GlobalUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    company_name?: string;
    [key: string]: any;
  };
  organizations?: {
    id: string;
    name: string;
  }[];
  is_master_admin: boolean;
}

interface GlobalSettings {
  id: string;
  max_users_per_org: number;
  max_invoices_per_month: number;
  storage_limit_gb: number;
  features_enabled: {
    advanced_reports: boolean;
    api_access: boolean;
    custom_branding: boolean;
    priority_support: boolean;
  };
  maintenance_mode: boolean;
  system_message?: string;
  created_at: string;
  updated_at: string;
}

const MasterAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [globalUsers, setGlobalUsers] = useState<GlobalUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  
  // Modal states
  const [organizationModal, setOrganizationModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'suspend' | 'delete';
    organization?: Organization | null;
  }>({ isOpen: false, mode: 'create', organization: null });
  
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'promote' | 'suspend' | 'delete';
    user?: GlobalUser | null;
  }>({ isOpen: false, mode: 'create', user: null });

  useEffect(() => {
    checkMasterAdminStatus();
  }, [user]);

  const checkMasterAdminStatus = async () => {
    if (!user) return;
    
    try {
      // Temporariamente definindo como master admin para demonstração
      // TODO: Implementar verificação real quando a função is_master_admin estiver disponível
      setIsMasterAdmin(true);
      loadStats();
      loadOrganizations();
      loadGlobalUsers();
      loadGlobalSettings();
    } catch (error) {
      console.error('Erro ao verificar master admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Implementar consultas reais ao banco de dados
      // Por enquanto, usando dados mock para demonstração
      const mockStats: SaasStats = {
        total_organizations: 0,
        total_users: 0,
        total_clients: 0,
        total_invoices: 0,
        total_expenses: 0,
        total_master_admins: 1,
        total_revenue: 0,
        total_expenses_amount: 0
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas.",
        variant: "destructive"
      });
    }
  };

  const loadOrganizations = async () => {
    try {
      // TODO: Implementar consulta real ao banco de dados
      // Por enquanto, usando dados mock para demonstração
      setOrganizations([]);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as organizações.",
        variant: "destructive"
      });
    }
  };

  const loadGlobalUsers = async () => {
    try {
      // TODO: Implementar consulta real ao banco de dados
      // Por enquanto, usando dados mock para demonstração
      setGlobalUsers([]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      });
    }
  };

  const loadGlobalSettings = async () => {
    try {
      setIsSettingsLoading(true);
      // TODO: Implementar consulta real ao banco de dados
      // Por enquanto, usando dados mock para demonstração
      const mockSettings: GlobalSettings = {
        id: '1',
        max_users_per_org: 100,
        max_invoices_per_month: 1000,
        storage_limit_gb: 10,
        features_enabled: {
          advanced_reports: true,
          api_access: true,
          custom_branding: false,
          priority_support: false
        },
        maintenance_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setGlobalSettings(mockSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isMasterAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Admin</h1>
            <p className="text-muted-foreground">Painel de controle global do SaaS</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="organizations">Organizações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="support">Suporte</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Dashboard Master Admin</h3>
              <p className="text-gray-600">Métricas globais do SaaS em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Gestão de Organizações</h3>
              <p className="text-gray-600">Gerenciamento completo de organizações em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Gestão de Usuários</h3>
              <p className="text-gray-600">Gerenciamento global de usuários em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <DebugPanel />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <FinancialReports />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <SupportSystem />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Configurações Globais</h3>
              <p className="text-gray-600">Configurações do sistema em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MasterAdmin;