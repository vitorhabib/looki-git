import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Plus,
  FileText,
  Repeat,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/hooks/useServices";

import { InvoiceModal } from "@/components/modals/InvoiceModal";
import { useMemo, useEffect, useState } from "react";

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const { currentOrganization } = useAuth();
  const { 
    recurringServices, 
    oneTimeServices, 
    loading: servicesLoading,
    loadRecurringServices,
    loadOneTimeServices 
  } = useServices();
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const client = useMemo(() => {
    return clients.find(c => c.id === id);
  }, [clients, id]);

  const clientInvoices = useMemo(() => {
    return invoices.filter(inv => inv.client_id === id);
  }, [invoices, id]);

  const handleEditClient = () => {
    if (!currentOrganization) return;
    navigate(`/org/${currentOrganization.id}/clients/${id}/edit`);
  };

  const handleNewInvoice = () => {
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceClick = (invoiceId: string) => {
    if (!currentOrganization) return;
    navigate(`/org/${currentOrganization.id}/invoices/${invoiceId}`);
  };

  const totalRevenue = clientInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount * 100), 0);

  const pendingAmount = clientInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total_amount * 100), 0);

  // Carregar serviços quando o cliente for carregado
  useEffect(() => {
    if (client?.id) {
      loadRecurringServices(client.id);
      loadOneTimeServices(client.id);
    }
  }, [client?.id]);

  // Filtrar serviços do cliente atual
  const clientRecurringServices = recurringServices.filter(service => service.client_id === id);
  const clientOneTimeServices = oneTimeServices.filter(service => service.client_id === id);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      pending: { label: 'Pendente', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    const frequencyMap = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cliente não encontrado.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => currentOrganization && navigate(`/org/${currentOrganization.id}/clients`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">
              Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button onClick={handleEditClient}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Client Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{client.document}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <div>{client.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.city} - {client.state}, {client.zip_code}
                      </div>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status="active" />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Money valueCents={totalRevenue} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Money valueCents={pendingAmount} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seções */}
        <div className="space-y-6">
          {/* Serviços Recorrentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Serviços Recorrentes
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Próxima Cobrança</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRecurringServices.length > 0 ? (
                    clientRecurringServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Money valueCents={service.amount} />
                        </TableCell>
                        <TableCell>
                          {getFrequencyLabel(service.frequency)}
                        </TableCell>
                        <TableCell>
                          {new Date(service.next_billing_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(service.status)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum serviço recorrente cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Serviços Pontuais */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Serviços Pontuais
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data de Execução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Pagamento</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientOneTimeServices.length > 0 ? (
                    clientOneTimeServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Money valueCents={service.amount} />
                        </TableCell>
                        <TableCell>
                          {new Date(service.execution_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(service.status)}
                        </TableCell>
                        <TableCell>
                          {service.payment_date ? (
                            <div className="text-sm">
                              {new Date(service.payment_date).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum serviço pontual cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Histórico de Cobranças */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Histórico de Cobranças
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleNewInvoice}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cobrança</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientInvoices.length > 0 ? (
                      clientInvoices.map((invoice) => (
                        <TableRow 
                          key={invoice.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          <TableCell>
                            <div className="font-medium">{invoice.title || invoice.notes || 'Cobrança'}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(invoice.issue_date).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Money valueCents={invoice.total_amount * 100} />
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at ? (
                              <div className="text-sm text-success">
                                Pago em {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">-</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <FileText className="h-12 w-12" />
                            <div className="text-lg font-medium">Quando você criar uma cobrança ela irá aparecer aqui!</div>
                            <p className="text-sm">Este cliente ainda não possui cobranças. Crie a primeira cobrança para começar.</p>
                            <Button 
                              onClick={handleNewInvoice}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nova Cobrança
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
      </div>
      
      {/* Modal de Nova Cobrança */}
      <InvoiceModal 
        open={isInvoiceModalOpen} 
        onOpenChange={setIsInvoiceModalOpen}
        onSuccess={() => {
          // Recarregar dados após criar a fatura
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
}