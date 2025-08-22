import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  Copy, 
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientContactInfoProps {
  client: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    status?: string;
  };
}

export function ClientContactInfo({ client }: ClientContactInfoProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const sendEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'Inativo', className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || 
      { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Informações de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {/* Status */}
        {client.status && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            {getStatusBadge(client.status)}
          </div>
        )}

        {/* Email */}
        {client.email && (
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{client.email}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(client.email!, 'Email')}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendEmail(client.email!)}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Telefone */}
        {client.phone && (
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(client.phone!, 'Telefone')}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openWhatsApp(client.phone!)}
                className="h-8 w-8 p-0"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}



        {/* Endereço */}
        {client.address && (
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Endereço</p>
                <p className="text-sm text-gray-600">{client.address}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(client.address!, 'Endereço')}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}