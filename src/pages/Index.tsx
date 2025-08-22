import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Money } from "@/components/ui/money";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useExpenses } from "@/hooks/useExpenses";
import { KpiCardSkeleton, CardListSkeleton } from "@/components/ui/card-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { expensesList, loading: expensesLoading, updateExpense } = useExpenses(currentOrganization?.id);
  
  const isLoading = invoicesLoading || clientsLoading || expensesLoading;

  const clientsMap = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = client;
      return acc;
    }, {} as Record<string, any>);
  }, [clients]);

  const kpis = useMemo(() => {
    const totalProvisionado = invoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
    const totalRecebido = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
    
    // Despesas considera tanto as pagas quanto as em aberto
    const totalDespesas = expensesList
      .filter(exp => exp.status === 'paid' || exp.status === 'pending')
      .reduce((sum, exp) => sum + (exp.amount * 100), 0);
    
    return {
      provisionado: totalProvisionado,
      recebido: totalRecebido,
      despesas: totalDespesas,
      saldo: totalRecebido - totalDespesas
    };
  }, [invoices, expensesList]);

  const alerts = useMemo(() => {
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue' || 
      (inv.status === 'sent' && new Date(inv.due_date) < today)
    );
    const dueTodayInvoices = invoices.filter(inv => 
      inv.status === 'sent' && 
      new Date(inv.due_date).toDateString() === today.toDateString()
    );
    const pendingInvoices = invoices.filter(inv => 
      inv.status === 'draft' || inv.status === 'sent'
    );
    const pendingExpenses = expensesList.filter(exp => 
      exp.status === 'pending'
    );
    const overdueExpenses = expensesList.filter(exp => 
      exp.status === 'overdue'
    );

    const alertsList = [];
    
    // Criar um card individual para cada fatura atrasada (clientes inadimplentes)
    overdueInvoices.forEach((invoice, index) => {
      const clientName = clientsMap[invoice.client_id]?.name || 'Cliente não encontrado';
      alertsList.push({
        id: `overdue-invoice-${invoice.id}`,
        type: 'overdue-invoice',
        title: clientName,
        description: `Vencimento: ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}`,
        amount: invoice.total_amount * 100,
        urgent: true,
        invoice: invoice,
        action: () => navigate(`/invoices/${invoice.id}`)
      });
    });
    
    // Criar um card individual para cada despesa atrasada
    overdueExpenses.forEach((expense, index) => {
      alertsList.push({
        id: `overdue-expense-${expense.id}`,
        type: 'overdue-expense',
        title: expense.description || 'Despesa sem descrição',
        description: `Data: ${new Date(expense.expense_date).toLocaleDateString('pt-BR')}`,
        amount: expense.amount * 100,
        urgent: true,
        expense: expense,
        action: () => navigate('/expenses')
      });
    });

    // Card unificado para outros itens pendentes (cobranças)
    const totalPendingInvoices = pendingInvoices.length + dueTodayInvoices.length;
    if (totalPendingInvoices > 0) {
      const totalPendingAmount = 
        pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0) +
        dueTodayInvoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
      
      const pendingDetails = [];
      if (dueTodayInvoices.length > 0) pendingDetails.push(`${dueTodayInvoices.length} vencem hoje`);
      if (pendingInvoices.length > 0) pendingDetails.push(`${pendingInvoices.length} cobranças pendentes`);
      
      alertsList.push({
        id: 'pending-invoices-unified',
        type: 'pending-invoices',
        title: 'Cobranças Pendentes',
        description: pendingDetails.join(', '),
        amount: totalPendingAmount,
        urgent: false,
        action: () => navigate('/invoices')
      });
    }

    // Card unificado para despesas pendentes
    if (pendingExpenses.length > 0) {
      const pendingExpensesAmount = pendingExpenses.reduce((sum, exp) => sum + (exp.amount * 100), 0);
      alertsList.push({
        id: 'pending-expenses-unified',
        type: 'pending-expenses',
        title: 'Despesas Pendentes',
        description: `${pendingExpenses.length} despesas aguardando pagamento`,
        amount: pendingExpensesAmount,
        urgent: false,
        action: () => navigate('/expenses')
      });
    }

    return alertsList;
  }, [invoices, expensesList, navigate]);

  const recentInvoices = useMemo(() => {
    return invoices
      .slice(0, 3)
      .map(invoice => ({
        id: invoice.invoice_number,
        client: clientsMap[invoice.client_id]?.name || 'Cliente não encontrado',
        amount: invoice.total_amount * 100,
        status: invoice.status,
        dueDate: invoice.due_date
      }));
  }, [invoices, clientsMap]);

  const handleViewInvoices = () => {
    navigate('/invoices');
  };

  const handleViewExpenses = () => {
    navigate('/expenses');
  };

  const handleViewBilling = () => {
    navigate('/billing');
  };

  const handleViewInvoiceDetail = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Função temporária para testar atualização de despesas vencidas
  const handleUpdateOverdueExpenses = async () => {
    console.log('🔄 Iniciando atualização de despesas vencidas...');
    try {
      const { expenses } = await import('@/lib/supabase');
      console.log('📦 Módulo supabase importado com sucesso');
      
      const result = await expenses.updateOverdueExpenses();
      console.log('📊 Resultado da atualização:', result);
      
      if (result.error) {
        console.error('❌ Erro na atualização:', result.error);
        toast({
          title: 'Erro ao atualizar despesas',
          description: result.error.message,
          variant: 'destructive'
        });
      } else {
        console.log('✅ Atualização bem-sucedida:', result.data);
        toast({
          title: 'Despesas atualizadas',
          description: `${result.data?.[0]?.updated_count || 0} despesas foram marcadas como atrasadas`,
        });
        // Recarregar a página para ver as mudanças
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('💥 Exceção na atualização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao executar atualização de despesas vencidas',
        variant: 'destructive'
      });
    }
  };

  const handleDebugExpenses = async () => {
    try {
      console.log('=== DEBUG DESPESAS ===');
      console.log('Total de despesas carregadas:', expensesList.length);
      console.log('Despesas por status:');
      const statusCount = expensesList.reduce((acc, exp) => {
        acc[exp.status] = (acc[exp.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(statusCount);
      
      console.log('Despesas overdue encontradas:');
      const overdueExpenses = expensesList.filter(exp => exp.status === 'overdue');
      console.log(overdueExpenses);
      
      console.log('Alertas gerados:', alerts.length);
      console.log('Alertas:', alerts);
      
      toast({
        title: 'Debug',
        description: `${expensesList.length} despesas total, ${overdueExpenses.length} overdue, ${alerts.length} alertas. Veja o console.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro no debug:', error);
    }
  };

  // Função temporária para criar despesas de teste com datas passadas
  const handleCreateTestExpenses = async () => {
    if (!user) return;
    
    try {
      const { expenses } = await import('@/lib/supabase');
      
      // Criar 3 despesas com datas passadas
      const testExpenses = [
        {
          title: 'Aluguel - Janeiro',
          description: 'Despesa de teste - aluguel do escritório',
          amount: 2500,
          organization_id: user.id,
          expense_date: '2024-01-15', // Data passada
          payment_method: 'bank_transfer',
          status: 'overdue' as const
        },
        {
          title: 'Energia Elétrica - Dezembro',
          description: 'Despesa de teste - conta de luz',
          amount: 450,
          organization_id: user.id,
          expense_date: '2023-12-20', // Data passada
          payment_method: 'debit_card',
          status: 'overdue' as const
        },
        {
          title: 'Internet - Novembro',
          description: 'Despesa de teste - conta de internet',
          amount: 120,
          organization_id: user.id,
          expense_date: '2023-11-10', // Data passada
          payment_method: 'credit_card',
          status: 'overdue' as const
        }
      ];

      let createdCount = 0;
      for (const expense of testExpenses) {
        const result = await expenses.create(expense);
        if (!result.error) {
          createdCount++;
        } else if (result.error) {
          console.error('Erro ao criar despesa:', result.error);
        }
      }

      toast({
        title: 'Despesas de teste criadas',
        description: `${createdCount} despesas com datas passadas foram criadas para teste`,
      });
      
      // Aguardar um pouco e recarregar
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Erro geral:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar despesas de teste',
        variant: 'destructive'
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">Visão geral da sua agência no mês {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>

        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <div>
                <KpiCard
                  title="Provisionado (Mês)"
                  value={<Money valueCents={kpis.provisionado} />}
                  icon={Clock}
                  variant="default"
                  trend={{
                    value: 12,
                    label: "vs mês anterior",
                    isPositive: true
                  }}
                />
              </div>
              <div>
                <KpiCard
                  title="Recebido (Mês)"
                  value={<Money valueCents={kpis.recebido} />}
                  icon={CheckCircle2}
                  variant="success"
                  trend={{
                    value: 8,
                    label: "vs mês anterior",
                    isPositive: true
                  }}
                />
              </div>
              <div>
                <KpiCard
                  title="Despesas"
                  value={<Money valueCents={kpis.despesas} />}
                  icon={TrendingDown}
                  variant="danger"
                  trend={{
                    value: 5,
                    label: "vs mês anterior",
                    isPositive: false
                  }}
                />
              </div>
              <div>
                <KpiCard
                  title="Saldo Atual"
                  value={<Money valueCents={kpis.saldo} />}
                  icon={Wallet}
                  variant="success"
                  trend={{
                    value: 15,
                    label: "vs mês anterior", 
                    isPositive: true
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Alerts and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Alertas e Pendências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <CardListSkeleton count={3} />
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-center">
                  <div>
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                    <h4 className="font-medium text-lg mb-2">Tudo em dia!</h4>
                    <p className="text-sm text-muted-foreground">Não há cobranças ou despesas pendentes no momento.</p>
                  </div>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`flex items-center gap-3 p-4 rounded-lg border hover:shadow-md transition-all ${
                      alert.urgent 
                        ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                        : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                    } ${
                      alert.type !== 'overdue-expense' ? 'cursor-pointer' : ''
                    }`}
                    onClick={alert.type !== 'overdue-expense' ? alert.action : undefined}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      alert.urgent 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {alert.type.includes('expenses') ? (
                        <Receipt className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      {alert.details && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {alert.details.invoices > 0 && <span>📄 {alert.details.invoices} cobranças</span>}
                          {alert.details.expenses > 0 && <span>🧾 {alert.details.expenses} despesas</span>}
                          {alert.details.dueToday > 0 && <span>⏰ {alert.details.dueToday} hoje</span>}
                          {alert.details.pendingInvoices > 0 && <span>📄 {alert.details.pendingInvoices} pendentes</span>}
                          {alert.details.pendingExpenses > 0 && <span>🧾 {alert.details.pendingExpenses} pendentes</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <Money 
                          valueCents={alert.amount} 
                          className={`text-lg font-bold ${
                            alert.urgent ? 'text-red-700' : 'text-amber-700'
                          }`} 
                        />
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      
                      {/* Botões de ação para faturas atrasadas */}
                      {alert.type === 'overdue-invoice' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoices/${alert.invoice.id}`);
                            }}
                            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                            title="Ver detalhes da fatura"
                          >
                            <Receipt className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Aqui você pode adicionar a lógica para marcar como pago
                              console.log('Marcar fatura como paga:', alert.invoice.id);
                            }}
                            className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors duration-200"
                            title="Marcar como pago"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </button>
                        </div>
                      )}
                      
                      {/* Botões de ação para despesas atrasadas */}
                      {alert.type === 'overdue-expense' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/expenses');
                            }}
                            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                            title="Ver mais detalhes"
                          >
                            <Receipt className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await updateExpense(alert.expense.id, { status: 'paid' });
                                toast({
                                  title: 'Despesa marcada como paga',
                                  description: `A despesa "${alert.expense.title}" foi marcada como paga.`,
                                });
                              } catch (error) {
                                toast({
                                  title: 'Erro ao marcar despesa como paga',
                                  description: 'Tente novamente mais tarde.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors duration-200"
                            title="Marcar como pago"
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Expanded Projection Chart */}
        <div className="w-full">
          <ProjectionChart />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
