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
  Receipt
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

const Index = () => {
  const navigate = useNavigate();
  const { currentOrganization } = useAuth();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { expensesList, loading: expensesLoading } = useExpenses(currentOrganization?.id);
  
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
  }, [invoices, expensesList, currentOrganization]);

  const alerts = useMemo(() => {
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue'
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

    const alertsList = [];
    
    if (overdueInvoices.length > 0) {
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
      alertsList.push({
        id: 1,
        type: 'overdue',
        title: 'Cobranças em atraso',
        description: `${overdueInvoices.length} cobranças vencidas`,
        amount: overdueAmount,
        urgent: true,
        action: () => navigate('/invoices?filter=overdue')
      });
    }

    if (dueTodayInvoices.length > 0) {
      const dueTodayAmount = dueTodayInvoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
      alertsList.push({
        id: 2,
        type: 'due-today',
        title: 'Vencimento hoje',
        description: `${dueTodayInvoices.length} cobranças vencem hoje`,
        amount: dueTodayAmount,
        urgent: false,
        action: () => navigate('/invoices?filter=due-today')
      });
    }

    if (pendingInvoices.length > 0) {
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount * 100), 0);
      alertsList.push({
        id: 3,
        type: 'pending-invoices',
        title: 'Cobranças pendentes',
        description: `${pendingInvoices.length} cobranças aguardando envio/pagamento`,
        amount: pendingAmount,
        urgent: false,
        action: () => navigate('/invoices?filter=pending')
      });
    }

    if (pendingExpenses.length > 0) {
      const expensesAmount = pendingExpenses.reduce((sum, exp) => sum + (exp.amount * 100), 0);
      alertsList.push({
        id: 4,
        type: 'pending-expenses',
        title: 'Despesas pendentes',
        description: `${pendingExpenses.length} despesas aguardando pagamento`,
        amount: expensesAmount,
        urgent: false,
        action: () => navigate('/expenses?filter=pending')
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
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${alert.urgent ? 'bg-danger-muted' : 'bg-warning-muted'}`}>
                        {alert.type === 'pending-expenses' ? (
                          <Receipt className={`h-4 w-4 ${alert.urgent ? 'text-danger' : 'text-warning'}`} />
                        ) : (
                          <AlertCircle className={`h-4 w-4 ${alert.urgent ? 'text-danger' : 'text-warning'}`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Money valueCents={alert.amount} className="font-medium" />
                      <Button size="sm" variant="outline" className="mt-2" onClick={alert.action}>
                        Ver Detalhes
                      </Button>
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
