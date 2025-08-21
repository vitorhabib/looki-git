import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FinancialData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  growth: number;
  organizations: number;
}

interface OrganizationRevenue {
  id: string;
  name: string;
  revenue: number;
  growth: number;
  invoices: number;
  plan: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

const FinancialReports = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [organizationRevenue, setOrganizationRevenue] = useState<OrganizationRevenue[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Mock data - em produção, estes dados viriam do Supabase
  const mockFinancialData: FinancialData[] = [
    { period: 'Jan 2024', revenue: 45000, expenses: 15000, profit: 30000, growth: 12.5, organizations: 25 },
    { period: 'Fev 2024', revenue: 52000, expenses: 18000, profit: 34000, growth: 15.6, organizations: 28 },
    { period: 'Mar 2024', revenue: 48000, expenses: 16000, profit: 32000, growth: 6.7, organizations: 30 },
    { period: 'Abr 2024', revenue: 58000, expenses: 20000, profit: 38000, growth: 20.8, organizations: 32 },
    { period: 'Mai 2024', revenue: 62000, expenses: 22000, profit: 40000, growth: 6.9, organizations: 35 },
    { period: 'Jun 2024', revenue: 67000, expenses: 24000, profit: 43000, growth: 8.1, organizations: 38 }
  ];

  const mockOrganizationRevenue: OrganizationRevenue[] = [
    { id: '1', name: 'TechCorp Solutions', revenue: 12500, growth: 25.3, invoices: 45, plan: 'Enterprise' },
    { id: '2', name: 'Digital Marketing Pro', revenue: 8900, growth: 18.7, invoices: 32, plan: 'Pro' },
    { id: '3', name: 'StartupHub', revenue: 6700, growth: -5.2, invoices: 28, plan: 'Pro' },
    { id: '4', name: 'Creative Agency', revenue: 5400, growth: 12.1, invoices: 22, plan: 'Basic' },
    { id: '5', name: 'E-commerce Plus', revenue: 4800, growth: 8.9, invoices: 18, plan: 'Pro' }
  ];

  const mockExpenseCategories: ExpenseCategory[] = [
    { category: 'Infraestrutura', amount: 8500, percentage: 35.4, trend: 'up' },
    { category: 'Suporte', amount: 6200, percentage: 25.8, trend: 'stable' },
    { category: 'Marketing', amount: 4800, percentage: 20.0, trend: 'up' },
    { category: 'Desenvolvimento', amount: 3200, percentage: 13.3, trend: 'down' },
    { category: 'Administrativo', amount: 1300, percentage: 5.5, trend: 'stable' }
  ];

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, selectedYear]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFinancialData(mockFinancialData);
      setOrganizationRevenue(mockOrganizationRevenue);
      setExpenseCategories(mockExpenseCategories);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados financeiros.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
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

  const exportReport = async (type: string) => {
    toast({
      title: 'Exportando relatório',
      description: `Gerando relatório ${type}...`
    });
    // Implementar lógica de exportação
  };

  const totalRevenue = financialData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = financialData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageGrowth = financialData.reduce((sum, item) => sum + item.growth, 0) / financialData.length;

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Avançados
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar Relatório</DialogTitle>
                <DialogDescription>
                  Escolha o formato e período para exportação
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => exportReport('PDF')} className="h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    PDF
                  </Button>
                  <Button onClick={() => exportReport('Excel')} className="h-20 flex-col" variant="outline">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${averageGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {formatPercentage(averageGrowth)}
              </span>
              {' '}vs período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalExpenses / totalRevenue) * 100).toFixed(1)}% da receita
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Margem: {((totalProfit / totalRevenue) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizações Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData[financialData.length - 1]?.organizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{((financialData[financialData.length - 1]?.organizations || 0) - (financialData[0]?.organizations || 0))} este período
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="organizations">Por Organização</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Financeira</CardTitle>
                <CardDescription>Receita, despesas e lucro por período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4" />
                    <div className="text-sm">Gráfico de Evolução Financeira</div>
                    <div className="text-xs mt-1">Receita: {formatCurrency(totalRevenue)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita</CardTitle>
                <CardDescription>Por plano de assinatura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <div className="text-sm">Gráfico de Distribuição</div>
                    <div className="text-xs mt-1">Enterprise: 45% | Pro: 35% | Basic: 20%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Organização</CardTitle>
              <CardDescription>Performance financeira das organizações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Crescimento</TableHead>
                    <TableHead>Faturas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationRevenue.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant={org.plan === 'Enterprise' ? 'default' : org.plan === 'Pro' ? 'secondary' : 'outline'}>
                          {org.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(org.revenue)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center ${org.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {org.growth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {formatPercentage(org.growth)}
                        </span>
                      </TableCell>
                      <TableCell>{org.invoices}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Despesas</CardTitle>
              <CardDescription>Distribuição e tendências de gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseCategories.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">{category.percentage}% do total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.amount)}</p>
                      <div className="flex items-center space-x-1">
                        {category.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                        {category.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                        {category.trend === 'stable' && <div className="h-3 w-3 bg-gray-400 rounded-full" />}
                        <span className="text-xs text-muted-foreground">
                          {category.trend === 'stable' ? 'Estável' : category.trend === 'up' ? 'Subindo' : 'Descendo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Crescimento</CardTitle>
                <CardDescription>Análise de crescimento mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <div className="text-sm">Gráfico de Tendências</div>
                    <div className="text-xs mt-1">Crescimento médio: {formatPercentage(averageGrowth)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Projeções</CardTitle>
                <CardDescription>Estimativas para os próximos meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">Próximo Mês</p>
                      <p className="text-sm text-green-600">Projeção otimista</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-800">{formatCurrency(72000)}</p>
                      <p className="text-xs text-green-600">+7.5%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-800">Trimestre</p>
                      <p className="text-sm text-blue-600">Projeção conservadora</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-800">{formatCurrency(210000)}</p>
                      <p className="text-xs text-blue-600">+5.2%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-800">Ano</p>
                      <p className="text-sm text-purple-600">Meta anual</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-800">{formatCurrency(850000)}</p>
                      <p className="text-xs text-purple-600">+15%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;