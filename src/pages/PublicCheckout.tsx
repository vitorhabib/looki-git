import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Smartphone, 
  FileText, 
  Calendar,
  Building2,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  Copy,
  QrCode
} from "lucide-react";
import { useState } from "react";
import { Money } from "@/components/ui/money";

const mockInvoice = {
  id: "INV-2024-001",
  amount: 2500,
  description: "Marketing Digital - Janeiro/2024",
  dueDate: "2024-02-15",
  client: {
    name: "João Silva",
    email: "joao@empresa.com",
    phone: "(11) 99999-9999"
  },
  agency: {
    name: "Agência Demo",
    email: "contato@agencia.com",
    phone: "(11) 88888-8888"
  },
  services: [
    { name: "Gestão de Redes Sociais", amount: 1500 },
    { name: "Google Ads", amount: 800 },
    { name: "Criação de Conteúdo", amount: 200 }
  ],
  pixCode: "00020126580014BR.GOV.BCB.PIX013636c4b8c4-4c4c-4c4c-4c4c-4c4c4c4c4c4c5204000053039865802BR5925AGENCIA DEMO LTDA6009SAO PAULO62070503***6304ABCD"
};

export default function PublicCheckout() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [copied, setCopied] = useState(false);

  const copyPixCode = () => {
    navigator.clipboard.writeText(mockInvoice.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 p-4">
      <div className="container max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{mockInvoice.agency.name}</h1>
          </div>
          <p className="text-muted-foreground">Checkout Seguro</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Número:</span>
                  <span className="font-medium">{mockInvoice.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vencimento:</span>
                  <span className="font-medium">
                    {new Date(mockInvoice.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{mockInvoice.client.name}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Serviços:</h4>
                {mockInvoice.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{service.name}</span>
                    <Money valueCents={service.amount} />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <Money valueCents={mockInvoice.amount} />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Pagamento 100% seguro</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pix" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </TabsTrigger>
                  <TabsTrigger value="boleto" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Boleto
                  </TabsTrigger>
                </TabsList>

                {/* PIX Payment */}
                <TabsContent value="pix" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <QrCode className="h-32 w-32 mx-auto" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie o QR Code com seu app do banco ou copie o código PIX
                    </p>
                    <div className="space-y-2">
                      <Label>Código PIX:</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={mockInvoice.pixCode} 
                          readOnly 
                          className="text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyPixCode}
                          className="flex-shrink-0"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Pagamento confirmado automaticamente
                    </Badge>
                  </div>
                </TabsContent>

                {/* Card Payment */}
                <TabsContent value="card" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="João Silva"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Validade</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({...cardData, expiry: formatExpiry(e.target.value)})}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <Button className="w-full">
                      Pagar <Money valueCents={mockInvoice.amount} />
                    </Button>
                  </div>
                </TabsContent>

                {/* Boleto Payment */}
                <TabsContent value="boleto" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <h3 className="font-medium">Boleto Bancário</h3>
                      <p className="text-sm text-muted-foreground">
                        O boleto será gerado e enviado para seu email
                      </p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm">
                      <p><strong>Vencimento:</strong> {new Date(mockInvoice.dueDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Valor:</strong> <Money valueCents={mockInvoice.amount} /></p>
                    </div>
                    <Button className="w-full">
                      Gerar Boleto
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      Prazo de 1-2 dias úteis para compensação
                    </Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {mockInvoice.agency.email}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {mockInvoice.agency.phone}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Dúvidas? Entre em contato conosco
          </p>
        </div>
      </div>
    </div>
  );
}