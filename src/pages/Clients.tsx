import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Money } from "@/components/ui/money";
import { 
  Search, 
  Plus, 
  Filter,
  Users,
  Building2,
  Calendar,
  Phone,
  Mail,
  MoreHorizontal
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useMemo } from "react";

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, deleteClient, refreshClients } = useClients();
  const { invoices } = useInvoices();

  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      const clientInvoices = invoices.filter(inv => inv.client_id === client.id);
      const totalRevenue = clientInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid');
      const monthlyRevenue = paidInvoices
        .filter(inv => {
          const invoiceDate = new Date(inv.created_at);
          const currentMonth = new Date();
          return invoiceDate.getMonth() === currentMonth.getMonth() && 
                 invoiceDate.getFullYear() === currentMonth.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      
      const lastInvoice = clientInvoices
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        ...client,
        monthlyRevenue: monthlyRevenue * 100, // Convert to cents
        totalRevenue: totalRevenue * 100, // Convert to cents
        services: 0, // We don't have services data yet
        lastInvoice: lastInvoice ? lastInvoice.created_at.split('T')[0] : null
      };
    });
  }, [clients, invoices]);

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    navigate(`/clients/${clientId}/edit`);
  };

  const handleNewInvoice = (clientId: string, clientName: string) => {
    navigate(`/invoices`);
    toast({
      title: "Nova cobrança",
      description: `Redirecionando para faturas de ${clientName}.`,
    });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${clientName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteClient(clientId);
        await refreshClients();
        window.location.reload(); // Refresh da página
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
      }
    }
  };

  const totalClients = clientsWithStats.length;
  const activeClients = clientsWithStats.length; // Assumindo que todos os clientes são ativos
  const totalMonthlyRevenue = clientsWithStats.reduce((sum, client) => sum + client.monthlyRevenue, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e relacionamentos comerciais
            </p>
          </div>
          <Button onClick={() => navigate("/clients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>



        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." className="pl-10" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receita Mensal</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Última Cobrança</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Users className="h-12 w-12" />
                        <div className="text-lg font-medium">Quando você criar um cliente ele irá aparecer aqui!</div>
                        <p className="text-sm">Comece adicionando seu primeiro cliente para gerenciar seus relacionamentos comerciais.</p>
                        <Button 
                          onClick={() => navigate("/clients/new")}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Cliente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientsWithStats.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleClientClick(client.id)}
                    >
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                    <TableCell>
                      <Money valueCents={client.monthlyRevenue} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.services} ativo{client.services !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell>
                      {client.lastInvoice ? new Date(client.lastInvoice).toLocaleDateString('pt-BR') : 'Nenhuma'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleClientClick(client.id);
                          }}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client.id);
                          }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleNewInvoice(client.id, client.name);
                          }}>Nova cobrança</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id, client.name);
                            }}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}