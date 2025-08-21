import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceTableSkeleton, ClientTableSkeleton } from "@/components/ui/table-skeleton";
import { CardListSkeleton } from "@/components/ui/card-skeleton";
import { 
  Search, 
  Plus, 
  Filter,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Eye,
  CheckCircle
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
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useClients, Client } from "@/hooks/useClients";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface InvoiceFormData {
  title: string;
  client_id: string;
  category_id: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string;
  payment_terms: string;
  is_recurring: boolean;
  recurring_frequency: 'monthly' | 'quarterly' | 'yearly';
  recurring_start_date: string;
  recurring_end_date: string;
}

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization } = useAuth();
  const { invoices, loading: invoicesLoading, createInvoice, updateInvoice, deleteInvoice, markAsPaid } = useInvoices();
  const { clients, loading: clientsLoading, createClient, updateClient, deleteClient } = useClients();
  const { revenueCategories, loading: categoriesLoading } = useCategories(currentOrganization?.id || null);
  
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  const [clientForm, setClientForm] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>({
    title: '',
    client_id: '',
    category_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    notes: '',
    payment_terms: 'Pagamento em 30 dias',
    is_recurring: false,
    recurring_frequency: 'monthly',
    recurring_start_date: new Date().toISOString().split('T')[0],
    recurring_end_date: ''
  });

  // Criar um mapa de clientes para lookup rápido
  const clientsMap = useMemo(() => {
    const map = new Map();
    clients.forEach(client => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  // Combinar dados de faturas com dados de clientes
  const invoicesWithClients = useMemo(() => {
    return invoices.map(invoice => ({
      ...invoice,
      clientName: clientsMap.get(invoice.client_id)?.name || 'Cliente não encontrado',
      amount: Math.round(invoice.total_amount * 100), // Converter para centavos
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      description: invoice.notes || 'Sem descrição',
      type: 'one-time' // Assumindo tipo padrão, pode ser ajustado conforme necessário
    }));
  }, [invoices, clientsMap]);

  const totalInvoices = invoicesWithClients.length;
  const paidInvoices = invoicesWithClients.filter(inv => inv.status === 'paid').length;
  const pendingAmount = invoicesWithClients
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoicesWithClients
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'sent': return <Clock className="h-4 w-4 text-warning" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-danger" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "Rascunho", icon: Clock },
      sent: { variant: "default" as const, label: "Enviada", icon: FileText },
      paid: { variant: "default" as const, label: "Paga", icon: CheckCircle },
      overdue: { variant: "destructive" as const, label: "Vencida", icon: AlertCircle },
      cancelled: { variant: "outline" as const, label: "Cancelada", icon: Trash2 }
    };
    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const handleOpenClientDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        email: client.email,
        phone: client.phone,
        document: client.document,
        address: client.address,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        city: '',
        state: '',
        zip_code: ''
      });
    }
    setClientDialogOpen(true);
  };

  const handleOpenInvoiceDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setInvoiceForm({
        title: invoice.title || '',
        client_id: invoice.client_id,
        category_id: invoice.category_id || '',
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        notes: invoice.notes || '',
        payment_terms: invoice.payment_terms || 'Pagamento em 30 dias',
        is_recurring: invoice.is_recurring || false,
        recurring_frequency: invoice.recurring_frequency || 'monthly',
        recurring_start_date: invoice.recurring_start_date || new Date().toISOString().split('T')[0],
        recurring_end_date: invoice.recurring_end_date || ''
      });
    } else {
      setEditingInvoice(null);
      setInvoiceForm({
        title: '',
        client_id: '',
        category_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        notes: '',
        payment_terms: 'Pagamento em 30 dias',
        is_recurring: false,
        recurring_frequency: 'monthly',
        recurring_start_date: new Date().toISOString().split('T')[0],
        recurring_end_date: ''
      });
    }
    setInvoiceDialogOpen(true);
  };

  const handleSaveClient = async () => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientForm);
        toast({
          title: "Cliente atualizado com sucesso!",
        });
      } else {
        await createClient(clientForm);
        toast({
          title: "Cliente criado com sucesso!",
        });
      }
      setClientDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar cliente",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  const handleSaveInvoice = async () => {
    try {
      if (!invoiceForm.client_id) {
        toast({
          title: "Selecione um cliente",
          variant: "destructive",
        });
        return;
      }
      
      if (clients.length === 0) {
        toast({
          title: "Cadastre pelo menos um cliente antes de criar uma fatura",
          variant: "destructive",
        });
        return;
      }
      
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceForm);
        toast({
          title: "Fatura atualizada com sucesso!",
        });
      } else {
        await createInvoice(invoiceForm);
        toast({
          title: "Fatura criada com sucesso!",
        });
      }
      setInvoiceDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar fatura",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
      toast({
        title: "Cliente excluído com sucesso!",
      });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fatura?')) {
      await deleteInvoice(id);
      toast({
        title: "Fatura excluída com sucesso!",
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid(id);
    toast({
      title: "Fatura marcada como paga!",
    });
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleSendReminder = (invoiceId: string, clientName: string) => {
    toast({
      title: "Lembrete enviado!",
      description: `Lembrete de pagamento enviado para ${clientName}.`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cobranças</h1>
            <p className="text-muted-foreground">
              Gerencie todas as cobranças, faturas e clientes
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{paidInvoices}</div>
              <p className="text-xs text-muted-foreground">Taxa: {totalInvoices > 0 ? Math.round(paidInvoices / totalInvoices * 100) : 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Money valueCents={pendingAmount} />
              </div>
              <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Money valueCents={overdueAmount} />
              </div>
              <p className="text-xs text-muted-foreground">Requer atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para Faturas e Clientes */}
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          {/* Aba de Faturas */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Faturas</h2>
              <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenInvoiceDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingInvoice ? 'Edite os dados da fatura.' : 'Crie uma nova fatura para seu cliente.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título da Fatura</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Desenvolvimento de Website, Consultoria Mensal..."
                        value={invoiceForm.title}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_id">Cliente</Label>
                      <Select value={invoiceForm.client_id} onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, client_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.length === 0 ? (
                            <SelectItem value="no-clients" disabled>
                              Nenhum cliente cadastrado
                            </SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category_id">Categoria</Label>
                      <Select value={invoiceForm.category_id} onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, category_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-category">Sem categoria</SelectItem>
                          {revenueCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issue_date">Data de Emissão</Label>
                        <Input
                          id="issue_date"
                          type="date"
                          value={invoiceForm.issue_date}
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, issue_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date">Vencimento</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={invoiceForm.due_date}
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="total_amount">Valor Total</Label>
                      <Input
                        id="total_amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={invoiceForm.total_amount}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={invoiceForm.status} onValueChange={(value: any) => setInvoiceForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="sent">Enviada</SelectItem>
                          <SelectItem value="paid">Paga</SelectItem>
                          <SelectItem value="overdue">Vencida</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Observações sobre a fatura..."
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    
                    {/* Campos de Recorrência */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_recurring"
                          checked={invoiceForm.is_recurring}
                          onChange={(e) => setInvoiceForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="is_recurring" className="text-sm font-medium">
                          Fatura Recorrente
                        </Label>
                      </div>
                      
                      {invoiceForm.is_recurring && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <Label htmlFor="recurring_frequency">Frequência</Label>
                            <Select 
                              value={invoiceForm.recurring_frequency} 
                              onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, recurring_frequency: value as 'monthly' | 'quarterly' | 'yearly' }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a frequência" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurring_start_date">Data de Início</Label>
                              <Input
                                id="recurring_start_date"
                                type="date"
                                value={invoiceForm.recurring_start_date}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, recurring_start_date: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="recurring_end_date">Data de Fim (Opcional)</Label>
                              <Input
                                id="recurring_end_date"
                                type="date"
                                value={invoiceForm.recurring_end_date}
                                onChange={(e) => setInvoiceForm(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSaveInvoice} className="flex-1">
                        {editingInvoice ? 'Atualizar' : 'Criar'} Fatura
                      </Button>
                      <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data de Emissão</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesLoading ? (
                      <></>  
                    ) : invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <FileText className="h-12 w-12" />
                            <div className="text-lg font-medium">Quando você criar uma fatura ela irá aparecer aqui!</div>
                            <p className="text-sm">Comece criando sua primeira fatura para gerenciar os pagamentos dos seus clientes.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.title || 'Sem título'}</TableCell>
                          <TableCell>{getClientName(invoice.client_id)}</TableCell>
                          <TableCell>
                            {invoice.category ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: invoice.category.color }}
                                />
                                <span className="text-sm">{invoice.category.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <Money valueCents={invoice.total_amount * 100} />
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenInvoiceDialog(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {invoicesLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
                  <InvoiceTableSkeleton />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Aba de Clientes */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Clientes</h2>
              <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenClientDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingClient ? 'Edite os dados do cliente.' : 'Cadastre um novo cliente para sua organização.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        placeholder="Nome do cliente"
                        value={clientForm.name}
                        onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={clientForm.email}
                        onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          placeholder="(11) 99999-9999"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="document">CPF/CNPJ</Label>
                        <Input
                          id="document"
                          placeholder="000.000.000-00"
                          value={clientForm.document}
                          onChange={(e) => setClientForm(prev => ({ ...prev, document: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        placeholder="Rua, número, complemento"
                        value={clientForm.address}
                        onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="Cidade"
                          value={clientForm.city}
                          onChange={(e) => setClientForm(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          placeholder="SP"
                          value={clientForm.state}
                          onChange={(e) => setClientForm(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input
                          id="zip_code"
                          placeholder="00000-000"
                          value={clientForm.zip_code}
                          onChange={(e) => setClientForm(prev => ({ ...prev, zip_code: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveClient} className="flex-1">
                        {editingClient ? 'Atualizar' : 'Criar'} Cliente
                      </Button>
                      <Button variant="outline" onClick={() => setClientDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="relative">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsLoading ? (
                      <></>  
                    ) : clients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Users className="h-12 w-12" />
                            <div className="text-lg font-medium">Quando você cadastrar um cliente ele irá aparecer aqui!</div>
                            <p className="text-sm">Comece cadastrando seu primeiro cliente para poder criar faturas.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell>{client.document}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenClientDialog(client)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {clientsLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
                  <ClientTableSkeleton />
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}