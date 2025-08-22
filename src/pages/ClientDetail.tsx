import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientAvatar } from "@/components/ui/client-avatar";
import { ClientContactInfo } from "@/components/ui/client-contact-info";
import { ClientStats } from "@/components/ui/client-stats";
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

  // Calcular estatísticas
  const openInvoicesCount = clientInvoices.filter(invoice => 
    invoice.status === 'draft' || invoice.status === 'sent'
  ).length;
  const overdueInvoicesCount = clientInvoices.filter(invoice => 
    invoice.status === 'overdue' || 
    ((invoice.status === 'draft' || invoice.status === 'sent') && new Date(invoice.due_date) < new Date())
  ).length;
  const activeServicesCount = clientRecurringServices.filter(service => service.status === 'active').length;
  const totalInvoicesCount = clientInvoices.length;

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
      <div className="space-y-6 animate-in fade-in-0 duration-500">
        {/* Botão Voltar */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => currentOrganization && navigate(`/org/${currentOrganization.id}/clients`)}
            className="text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para clientes
          </Button>
        </div>

        {/* Header do Cliente */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12 pb-6 border-b border-gray-100 animate-in slide-in-from-top-4 duration-700 delay-100">
          <div className="flex items-center gap-4">
            <ClientAvatar 
              name={client.name} 
              size="lg" 
              status={client.status || 'active'} 
              showStatus={true}
            />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">{client.name}</h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <Button onClick={handleEditClient} className="self-start sm:self-auto transition-all duration-200 hover:scale-105">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Estatísticas */}
          <div className="lg:col-span-2">
            <ClientStats 
              openInvoices={openInvoicesCount}
              overdueInvoices={overdueInvoicesCount}
              activeServices={activeServicesCount}
              totalInvoices={totalInvoicesCount}
            />
          </div>

          {/* Informações de Contato */}
          <div className="lg:col-span-1">
            <ClientContactInfo 
              client={{
                name: client.name,
                email: client.email,
                phone: client.phone,
                document: client.document,
                address: client.address ? `${client.address}, ${client.city} - ${client.state}, ${client.zip_code}` : undefined,
                status: client.status || 'active'
              }} 
            />
          </div>
        </div>

        {/* Seções */}
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 delay-300">
          {/* Serviços Recorrentes */}
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                  <Repeat className="h-6 w-6 text-blue-600" />
                  Serviços Recorrentes
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)} className="transition-all duration-200 hover:scale-105">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Serviço</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Valor</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Frequência</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Próxima Cobrança</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                    <TableHead className="w-[50px] py-4 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRecurringServices.length > 0 ? (
                    clientRecurringServices.map((service, index) => (
                      <TableRow key={service.id} className={`hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <TableCell className="py-4 px-6">
                          <div className="font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 font-semibold">
                          <Money valueCents={service.amount} />
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-700">
                          {getFrequencyLabel(service.frequency)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-700">
                          {new Date(service.next_billing_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(service.status)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-all duration-200 hover:scale-110">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                          <Repeat className="h-8 w-8 text-gray-300" />
                          <span>Nenhum serviço recorrente cadastrado.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Serviços Pontuais */}
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                  <FileText className="h-6 w-6 text-green-600" />
                  Serviços Pontuais
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)} className="transition-all duration-200 hover:scale-105">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Serviço</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Valor</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Data de Execução</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Data de Pagamento</TableHead>
                    <TableHead className="w-[50px] py-4 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientOneTimeServices.length > 0 ? (
                    clientOneTimeServices.map((service, index) => (
                      <TableRow key={service.id} className={`hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <TableCell className="py-4 px-6">
                          <div className="font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500 mt-1">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 font-semibold">
                          <Money valueCents={service.amount} />
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-700">
                          {new Date(service.execution_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(service.status)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-700">
                          {service.payment_date ? (
                            <div className="text-sm">
                              {new Date(service.payment_date).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-all duration-200 hover:scale-110">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-gray-300" />
                          <span>Nenhum serviço pontual cadastrado.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Cobranças */}
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                    <FileText className="h-6 w-6 text-purple-600" />
                    Histórico de Cobranças
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleNewInvoice} className="transition-all duration-200 hover:scale-105">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Cobrança</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Valor</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Vencimento</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Pagamento</TableHead>
                      <TableHead className="w-[50px] py-4 px-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientInvoices.length > 0 ? (
                      clientInvoices.map((invoice, index) => (
                        <TableRow 
                          key={invoice.id} 
                          className={`cursor-pointer hover:bg-blue-50 transition-all duration-200 hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                          onClick={() => handleInvoiceClick(invoice.id)}
                        >
                          <TableCell className="py-4 px-6">
                            <div className="font-medium text-gray-900">{invoice.title || invoice.notes || 'Cobrança'}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(invoice.issue_date).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 font-semibold">
                            <Money valueCents={invoice.total_amount * 100} />
                          </TableCell>
                          <TableCell className="py-4 px-6 text-gray-700">
                            {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell className="py-4 px-6 text-gray-700">
                            {invoice.paid_at ? (
                              <div className="text-sm text-green-600 font-medium">
                                Pago em {new Date(invoice.paid_at).toLocaleDateString('pt-BR')}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-all duration-200 hover:scale-110">
                               <MoreHorizontal className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16 bg-gray-50">
                          <div className="flex flex-col items-center gap-4 text-gray-500">
                            <FileText className="h-16 w-16 text-gray-300" />
                            <div className="text-xl font-semibold text-gray-700">Quando você criar uma cobrança ela irá aparecer aqui!</div>
                            <p className="text-sm text-gray-500 max-w-md">Este cliente ainda não possui cobranças. Crie a primeira cobrança para começar.</p>
                            <Button 
                              onClick={handleNewInvoice}
                              className="mt-4 bg-purple-600 hover:bg-purple-700"
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
                </div>
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