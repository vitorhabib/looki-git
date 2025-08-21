import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings as SettingsIcon,
  Building2,
  Users,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Zap,
  Clock,
  Play,
  RefreshCw
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations } from "@/hooks/useOrganizations";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const mockUsers: any[] = [];

const mockIntegrations: any[] = [];

export default function Settings() {
  const { currentOrganization, updateOrganization, user } = useAuth();
  const { deleteOrganization } = useOrganizations(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [orgData, setOrgData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: ""
  });
  
  // Estados para automação
  const [isGeneratingRecurring, setIsGeneratingRecurring] = useState(false);
  const [lastRecurringExecution, setLastRecurringExecution] = useState<string | null>(null);
  
  // Carregar dados da organização atual
  useEffect(() => {
    if (currentOrganization) {
      setOrgData({
        name: currentOrganization.name || "",
        email: currentOrganization.email || "",
        phone: currentOrganization.phone || "",
        address: currentOrganization.address || "",
        website: currentOrganization.website || ""
      });
    }
  }, [currentOrganization]);
  
  const handleSaveOrganization = async () => {
    if (!currentOrganization) {
      toast({
        title: "Erro",
        description: "Nenhuma organização selecionada",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
       await updateOrganization(currentOrganization.id, {
         name: orgData.name,
         email: orgData.email,
         phone: orgData.phone,
         address: orgData.address,
         website: orgData.website
       });
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!currentOrganization) {
      toast({
        title: "Erro",
        description: "Nenhuma organização selecionada",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOrganization(currentOrganization.id);
      
      toast({
        title: "Sucesso",
        description: "Organização excluída com sucesso",
      });
      
      // Redirecionar para a página de seleção de organizações
      navigate('/org-select');
    } catch (error) {
      console.error('Erro ao excluir organização:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir organização",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para executar geração de recorrências
  const handleGenerateRecurring = async () => {
    if (!currentOrganization) {
      toast({
        title: "Erro",
        description: "Nenhuma organização selecionada",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingRecurring(true);

    try {
      // Executar função de geração de faturas recorrentes
      const { data: invoicesData, error: invoicesError } = await supabase
        .rpc('generate_recurring_invoices');

      if (invoicesError) {
        console.error('Erro ao gerar faturas recorrentes:', invoicesError);
      }

      // Executar função de geração de despesas recorrentes
      const { data: expensesData, error: expensesError } = await supabase
        .rpc('generate_recurring_expenses');

      if (expensesError) {
        console.error('Erro ao gerar despesas recorrentes:', expensesError);
      }

      if (!invoicesError && !expensesError) {
        const invoicesCount = invoicesData || 0;
        const expensesCount = expensesData || 0;
        const totalGenerated = invoicesCount + expensesCount;

        setLastRecurringExecution(new Date().toLocaleString('pt-BR'));

        toast({
          title: "Sucesso",
          description: `${totalGenerated} registros recorrentes foram gerados (${invoicesCount} faturas, ${expensesCount} despesas)`,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Algumas funções de recorrência apresentaram erros. Verifique os logs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao executar funções de recorrência:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar funções de recorrência",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRecurring(false);
    }
  };

  const [notifications, setNotifications] = useState({
    emailInvoices: true,
    emailOverdue: true,
    whatsappReminders: false,
    weeklyReports: true,
    monthlyReports: true
  });

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: { variant: "default" as const, label: "Administrador" },
      manager: { variant: "secondary" as const, label: "Gerente" },
      user: { variant: "outline" as const, label: "Usuário" }
    };
    const config = variants[role as keyof typeof variants] || variants.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const getIntegrationStatus = (status: string) => {
    return (
      <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
        {status === 'connected' ? 'Conectado' : 'Desconectado'}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie sua organização, usuários e integrações
          </p>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organização
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Assinatura
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Automação
            </TabsTrigger>
          </TabsList>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações da Organização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nome da Organização</Label>
                    <Input
                      id="orgName"
                      value={orgData.name}
                      onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData({...orgData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Telefone</Label>
                    <Input
                      id="orgPhone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgWebsite">Website</Label>
                    <Input
                      id="orgWebsite"
                      value={orgData.website}
                      onChange={(e) => setOrgData({...orgData, website: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgAddress">Endereço</Label>
                  <Input
                    id="orgAddress"
                    value={orgData.address}
                    onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleSaveOrganization}
                  disabled={isLoading || !currentOrganization}
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone - Delete Organization */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">Excluir Organização</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Esta ação é <strong>irreversível</strong>. Todos os dados da organização serão permanentemente excluídos, incluindo:
                  </p>
                  <ul className="text-sm text-red-700 mb-4 ml-4 list-disc space-y-1">
                    <li>Todas as categorias</li>
                    <li>Todos os clientes</li>
                    <li>Todas as despesas</li>
                    <li>Todas as faturas e cobranças</li>
                    <li>Todos os serviços</li>
                    <li>Todos os usuários associados</li>
                  </ul>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        disabled={isDeleting}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? 'Excluindo...' : 'Excluir Organização'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                          Confirmar Exclusão da Organização
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Você está prestes a excluir permanentemente a organização <strong>"{currentOrganization?.name}"</strong>.
                          </p>
                          <p className="text-red-600 font-semibold">
                            Esta ação NÃO PODE ser desfeita!
                          </p>
                          <p>
                            Todos os dados relacionados (categorias, clientes, despesas, faturas, serviços e usuários) serão excluídos permanentemente.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteOrganization}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Sim, Excluir Permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários da Organização
                  </CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Convidar Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Plano Professional</h3>
                    <p className="text-sm text-muted-foreground">Até 50 clientes e cobranças ilimitadas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">R$ 97,00</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Próxima Cobrança</Label>
                    <p className="text-sm">15 de Fevereiro, 2024</p>
                  </div>
                  <div>
                    <Label>Método de Pagamento</Label>
                    <p className="text-sm">Cartão •••• 4532</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Alterar Plano</Button>
                  <Button variant="outline">Atualizar Pagamento</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificar sobre novas cobranças</Label>
                      <p className="text-sm text-muted-foreground">Receba emails quando cobranças forem criadas</p>
                    </div>
                    <Switch
                      checked={notifications.emailInvoices}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailInvoices: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas de vencimento</Label>
                      <p className="text-sm text-muted-foreground">Notificações sobre cobranças em atraso</p>
                    </div>
                    <Switch
                      checked={notifications.emailOverdue}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailOverdue: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lembretes via WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">Enviar lembretes de pagamento via WhatsApp</p>
                    </div>
                    <Switch
                      checked={notifications.whatsappReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, whatsappReminders: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Relatórios semanais</Label>
                      <p className="text-sm text-muted-foreground">Resumo semanal por email</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Relatórios mensais</Label>
                      <p className="text-sm text-muted-foreground">Relatório financeiro mensal</p>
                    </div>
                    <Switch
                      checked={notifications.monthlyReports}
                      onCheckedChange={(checked) => setNotifications({...notifications, monthlyReports: checked})}
                    />
                  </div>
                </div>
                <Button>Salvar Preferências</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Integrações Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mockIntegrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.icon}</div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground">
                              Última sincronização: {integration.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getIntegrationStatus(integration.status)}
                        <Button 
                          variant={integration.status === 'connected' ? 'outline' : 'default'}
                          size="sm"
                        >
                          {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sistema de Recorrência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3 mb-3">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Geração Automática de Recorrências</h3>
                        <p className="text-sm text-muted-foreground">
                          Gera automaticamente faturas e despesas recorrentes com base nas configurações definidas
                        </p>
                      </div>
                    </div>
                    
                    {lastRecurringExecution && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Última execução:</strong> {lastRecurringExecution}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={handleGenerateRecurring}
                        disabled={isGeneratingRecurring}
                        className="flex items-center gap-2"
                      >
                        {isGeneratingRecurring ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {isGeneratingRecurring ? 'Gerando...' : 'Executar Agora'}
                      </Button>
                      
                      <div className="text-sm text-muted-foreground">
                        Executa as funções de geração de faturas e despesas recorrentes
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">Execução Automática</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure a execução automática via Edge Functions do Supabase
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800 mb-2">
                          <strong>Status:</strong> Edge Function configurada para execução diária às 6:00 AM
                        </p>
                        <p className="text-xs text-blue-600">
                          Para ativar a execução automática, faça o deploy da Edge Function seguindo as instruções em:
                          <code className="ml-1 px-1 bg-blue-100 rounded">supabase/functions/README.md</code>
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Frequência:</strong> Diária
                        </div>
                        <div>
                          <strong>Horário:</strong> 06:00 (UTC-3)
                        </div>
                        <div>
                          <strong>Função:</strong> generate-recurring
                        </div>
                        <div>
                          <strong>Método:</strong> Edge Function + Cron
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <h4 className="font-semibold text-yellow-800">Informações Importantes</h4>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• As funções de recorrência processam apenas registros com data de vencimento igual ou anterior à data atual</li>
                      <li>• Faturas e despesas são geradas automaticamente com base na frequência configurada (mensal, trimestral, anual)</li>
                      <li>• O sistema calcula automaticamente a próxima data de recorrência após cada geração</li>
                      <li>• Para ativar a automação completa, é necessário fazer o deploy da Edge Function</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}