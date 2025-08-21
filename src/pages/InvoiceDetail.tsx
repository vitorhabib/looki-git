import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import { 
  ArrowLeft, 
  FileText, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  CheckCircle2,
  Copy,
  Download,
  Send,
  AlertCircle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useMemo, useEffect } from "react";

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { invoices, loading: invoicesLoading, markAsPaid } = useInvoices();
  const { clients } = useClients();

  // Encontrar a fatura específica
  const invoice = useMemo(() => {
    return invoices.find(inv => inv.id === id);
  }, [invoices, id]);

  // Encontrar o cliente da fatura
  const client = useMemo(() => {
    if (!invoice) return null;
    return clients.find(c => c.id === invoice.client_id);
  }, [clients, invoice]);

  // Obter itens da fatura (removido - não há mais tabela invoice_items)
  const items = useMemo(() => {
    return [];
  }, []);

  const pendingAmount = invoice ? (invoice.status === 'paid' ? 0 : invoice.total_amount) : 0;

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pagar/${id}`);
    toast({
      title: "Link copiado!",
      description: "Link de pagamento copiado para a área de transferência."
    });
  };

  const handleConfirmPayment = async () => {
    if (!invoice) return;
    try {
      await markAsPaid(invoice.id);
      toast({
        title: "Pagamento confirmado!",
        description: "O pagamento foi marcado como recebido."
      });
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível marcar como pago.",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = () => {
    if (!client) return;
    toast({
      title: "Lembrete enviado!",
      description: `Lembrete de pagamento enviado para ${client.email}`
    });
  };

  // Se não encontrou a fatura, mostrar erro
  if (!invoicesLoading && !invoice) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Fatura não encontrada</h1>
            <Button onClick={() => navigate('/invoices')}>Voltar para Faturas</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se ainda está carregando
  if (invoicesLoading || !invoice || !client) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'pix': return 'PIX';
      case 'bank_transfer': return 'Transferência';
      case 'cash': return 'Dinheiro';
      default: return method;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{invoice.title || invoice.invoice_number}</h1>
            <p className="text-muted-foreground">
              {invoice.title && <span className="text-sm text-muted-foreground">#{invoice.invoice_number} • </span>}
              Criada em {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSendReminder}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Lembrete
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Cliente</h4>
                    <div 
                      className="text-primary cursor-pointer hover:underline"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {client.phone || 'Não informado'}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Descrição</h4>
                    <p className="text-sm">{invoice.notes || 'Sem descrição'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Informações de Pagamento</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Vencimento:</span>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <Badge variant="outline">
                          Pontual
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.payment_terms && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Termos de Pagamento</h4>
                  <p className="text-sm text-muted-foreground">{invoice.payment_terms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Valor Total:</span>
                  <span className="font-mono">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valor Pago:</span>
                  <span className="font-mono text-success">
                    {formatCurrency(invoice.status === 'paid' ? invoice.total_amount : 0)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Saldo Pendente:</span>
                    <span className="font-mono text-lg">
                      <Money valueCents={pendingAmount} />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(`/pagar/${id}`, '_blank')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Abrir Página de Pagamento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleCopyPaymentLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link de Pagamento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleConfirmPayment}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Pagamento Manual
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total Geral:
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History and Intents */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Histórico de Pagamentos</TabsTrigger>
            <TabsTrigger value="intents">Tentativas de Pagamento</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.status === 'paid' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>{invoice.payment_method || 'Não informado'}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status="paid" />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          -
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    Nenhum pagamento registrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intents">
            <Card>
              <CardHeader>
                <CardTitle>Tentativas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        Nenhuma tentativa de pagamento registrada
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}