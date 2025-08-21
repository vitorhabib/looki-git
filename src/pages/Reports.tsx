import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign, 
  FileText, 
  Calendar,
  Download,
  Filter,
  Shield,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KpiCardSkeleton, CardListSkeleton } from '@/components/ui/card-skeleton';

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface OrganizationGrowth {
  month: string;
  organizations: number;
  users: number;
}

interface TopOrganization {
  id: string;
  name: string;
  revenue: number;
  users: number;
  invoices: number;
}

interface InvoiceStatusData {
  status: string;
  count: number;
  value: number;
  color: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalOrganizations: number;
  totalUsers: number;
  totalInvoices: number;
  revenueGrowth: number;
  userGrowth: number;
  organizationGrowth: number;
  averageRevenuePerOrg: number;
  averageUsersPerOrg: number;
  conversionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [organizationGrowth, setOrganizationGrowth] = useState<OrganizationGrowth[]>([]);
  const [topOrganizations, setTopOrganizations] = useState<TopOrganization[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<InvoiceStatusData[]>([]);

  useEffect(() => {
    checkMasterAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isMasterAdmin && dateRange?.from && dateRange?.to) {
      loadAnalyticsData();
    }
  }, [isMasterAdmin, dateRange, selectedPeriod]);

  const checkMasterAdminStatus = async () => {
    if (!user) return;
    
    try {
      // Temporariamente definindo como master admin para demonstração
      // TODO: Implementar verificação real quando a função is_master_admin estiver disponível
      setIsMasterAdmin(true);
    } catch (error) {
      console.error('Erro ao verificar master admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      // Carregar dados principais
      await Promise.all([
        loadMainAnalytics(),
        loadRevenueData(),
        loadOrganizationGrowth(),
        loadTopOrganizations(),
        loadInvoiceStatusData()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMainAnalytics = async () => {
    const { data: stats, error } = await supabase.from('saas_stats').select('*').single();
    if (error) throw error;

    // Calcular crescimento (simulado - em produção, você teria dados históricos)
    const mockAnalytics: AnalyticsData = {
      totalRevenue: stats.total_revenue || 0,
      totalExpenses: stats.total_expenses_amount || 0,
      totalProfit: (stats.total_revenue || 0) - (stats.total_expenses_amount || 0),
      totalOrganizations: stats.total_organizations || 0,
      totalUsers: stats.total_users || 0,
      totalInvoices: stats.total_invoices || 0,
      revenueGrowth: 12.5, // Simulado
      userGrowth: 8.3, // Simulado
      organizationGrowth: 15.2, // Simulado
      averageRevenuePerOrg: stats.total_organizations > 0 ? (stats.total_revenue || 0) / stats.total_organizations : 0,
      averageUsersPerOrg: stats.total_organizations > 0 ? (stats.total_users || 0) / stats.total_organizations : 0,
      conversionRate: 68.4 // Simulado
    };

    setAnalyticsData(mockAnalytics);
  };

  const loadRevenueData = async () => {
    // Em produção, você faria uma query real baseada no período selecionado
    const mockRevenueData: RevenueData[] = [
      { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
      { month: 'Fev', revenue: 52000, expenses: 35000, profit: 17000 },
      { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
      { month: 'Abr', revenue: 61000, expenses: 38000, profit: 23000 },
      { month: 'Mai', revenue: 55000, expenses: 36000, profit: 19000 },
      { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 }
    ];
    setRevenueData(mockRevenueData);
  };

  const loadOrganizationGrowth = async () => {
    const mockGrowthData: OrganizationGrowth[] = [
      { month: 'Jan', organizations: 12, users: 145 },
      { month: 'Fev', organizations: 15, users: 178 },
      { month: 'Mar', organizations: 18, users: 203 },
      { month: 'Abr', organizations: 22, users: 267 },
      { month: 'Mai', organizations: 25, users: 298 },
      { month: 'Jun', organizations: 28, users: 334 }
    ];
    setOrganizationGrowth(mockGrowthData);
  };

  const loadTopOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          invoices(total_amount),
          user_organizations(count)
        `)
        .limit(5);
      
      if (error) throw error;

      const topOrgs: TopOrganization[] = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        revenue: org.invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0,
        users: org.user_organizations?.length || 0,
        invoices: org.invoices?.length || 0
      })).sort((a, b) => b.revenue - a.revenue);

      setTopOrganizations(topOrgs);
    } catch (error) {
      console.error('Erro ao carregar top organizações:', error);
      // Dados mock em caso de erro
      const mockTopOrgs: TopOrganization[] = [
        { id: '1', name: 'Agência Digital Pro', revenue: 85000, users: 12, invoices: 45 },
        { id: '2', name: 'Marketing Solutions', revenue: 72000, users: 8, invoices: 38 },
        { id: '3', name: 'Creative Studio', revenue: 58000, users: 15, invoices: 32 },
        { id: '4', name: 'Brand Builders', revenue: 45000, users: 6, invoices: 28 },
        { id: '5', name: 'Growth Hackers', revenue: 38000, users: 9, invoices: 22 }
      ];
      setTopOrganizations(mockTopOrgs);
    }
  };

  const loadInvoiceStatusData = async () => {
    const mockStatusData: InvoiceStatusData[] = [
      { status: 'Pago', count: 156, value: 234000, color: '#00C49F' },
      { status: 'Pendente', count: 43, value: 87000, color: '#FFBB28' },
      { status: 'Vencido', count: 12, value: 23000, color: '#FF8042' },
      { status: 'Rascunho', count: 8, value: 15000, color: '#8884D8' }
    ];
    setInvoiceStatusData(mockStatusData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case 'week':
        setDateRange({
          from: subDays(now, 7),
          to: now
        });
        break;
      case 'month':
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        });
        break;
      case 'quarter':
        setDateRange({
          from: subDays(now, 90),
          to: now
        });
        break;
      case 'year':
        setDateRange({
          from: subDays(now, 365),
          to: now
        });
        break;
    }
  };

  const exportReport = () => {
    toast({
      title: 'Exportando Relatório',
      description: 'O relatório será baixado em breve...'
    });
    // Implementar exportação real aqui
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isMasterAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Relatórios e Analytics</h1>
            <p className="text-muted-foreground">Análises detalhadas e insights do seu SaaS</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="bg-red-600">
              <Shield className="mr-1 h-3 w-3" />
              Master Admin
            </Badge>
            <Button onClick={exportReport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>

        {/* KPIs Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : analyticsData ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    {formatPercentage(analyticsData.revenueGrowth)} vs mês anterior
                  </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizações Ativas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalOrganizations}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  {formatPercentage(analyticsData.organizationGrowth)} vs mês anterior
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  {formatPercentage(analyticsData.userGrowth)} vs mês anterior
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="mr-1 h-3 w-3 text-blue-500" />
                  Meta: 70%
                </div>
              </CardContent>
            </Card>
              </>
            ) : null}
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Receita & Lucro</TabsTrigger>
            <TabsTrigger value="growth">Crescimento</TabsTrigger>
            <TabsTrigger value="organizations">Organizações</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {loading ? (
                <>
                  <CardListSkeleton />
                  <CardListSkeleton />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita vs Despesas</CardTitle>
                      <CardDescription>Comparação mensal de receitas e despesas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#0088FE" name="Receita" />
                          <Bar dataKey="expenses" fill="#FF8042" name="Despesas" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do Lucro</CardTitle>
                  <CardDescription>Tendência de lucro ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#00C49F" 
                        fill="#00C49F" 
                        fillOpacity={0.3}
                        name="Lucro"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            {loading ? (
              <CardListSkeleton />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Organizações e Usuários</CardTitle>
                  <CardDescription>Evolução do número de organizações e usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={organizationGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="organizations" 
                        stroke="#8884D8" 
                        strokeWidth={3}
                        name="Organizações"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="users" 
                        stroke="#82CA9D" 
                        strokeWidth={3}
                        name="Usuários"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
            </Card>
             )}
           </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            {loading ? (
              <CardListSkeleton />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Organizações</CardTitle>
                  <CardDescription>Organizações com maior receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topOrganizations.map((org, index) => (
                      <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {org.users} usuários • {org.invoices} faturas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(org.revenue)}</p>
                          <p className="text-sm text-muted-foreground">Receita total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {loading ? (
                <>
                  <CardListSkeleton />
                  <CardListSkeleton />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Status das Faturas</CardTitle>
                      <CardDescription>Distribuição por status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, count }) => `${status}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Valor por Status</CardTitle>
                  <CardDescription>Valor total das faturas por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoiceStatusData.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="font-medium">{status.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(status.value)}</p>
                          <p className="text-sm text-muted-foreground">{status.count} faturas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;