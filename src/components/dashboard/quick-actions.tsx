import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useEffect, useState, useMemo } from "react";


interface DefaulterClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const [defaulterClients, setDefaulterClients] = useState<DefaulterClient[]>([]);

  const clientsMap = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = client;
      return acc;
    }, {} as Record<string, any>);
  }, [clients]);

  useEffect(() => {
    if (!clients.length || !invoices.length) return;

    const today = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue' || 
      (inv.status === 'sent' && new Date(inv.due_date) < today)
    );

    // Agrupar faturas atrasadas por cliente
    const clientsWithOverdueInvoices = new Map<string, any>();
    
    overdueInvoices.forEach(invoice => {
      const client = clientsMap[invoice.client_id];
      if (client && !clientsWithOverdueInvoices.has(client.id)) {
        clientsWithOverdueInvoices.set(client.id, {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone
        });
      }
    });

    setDefaulterClients(Array.from(clientsWithOverdueInvoices.values()));
  }, [clients, invoices, clientsMap]);

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (clientsLoading || invoicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Clientes Inadimplentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Clientes Inadimplentes
          {defaulterClients.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {defaulterClients.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {defaulterClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-4">
              <User className="h-6 w-6 text-red-400 dark:text-red-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum cliente inadimplente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {defaulterClients.map((client) => (
              <div
                key={client.id}
                className="group p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer"
                onClick={() => handleClientClick(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-sm text-foreground">
                        {client.name}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        Inadimplente
                      </Badge>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}