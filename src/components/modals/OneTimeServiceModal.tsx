import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useServices, OneTimeService } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";

interface OneTimeServiceModalProps {
  clientId: string;
  trigger?: React.ReactNode;
  onServiceCreated?: (service: OneTimeService) => void;
}

export function OneTimeServiceModal({ clientId, trigger, onServiceCreated }: OneTimeServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executionDate, setExecutionDate] = useState<Date>();
  const [paymentDate, setPaymentDate] = useState<Date>();
  const { createOneTimeService } = useServices();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    status: "pending" as "pending" | "completed" | "cancelled",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !executionDate) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const amountInCents = Math.round(parseFloat(formData.amount.replace(',', '.')) * 100);
      
      const serviceData = {
        client_id: clientId,
        name: formData.name,
        description: formData.description || undefined,
        amount: amountInCents,
        execution_date: executionDate.toISOString().split('T')[0],
        payment_date: paymentDate ? paymentDate.toISOString().split('T')[0] : undefined,
        status: formData.status,
        organization_id: '', // será preenchido pelo hook
      };

      const newService = await createOneTimeService(serviceData);
      
      if (newService && onServiceCreated) {
        onServiceCreated(newService);
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        amount: "",
        status: "pending",
      });
      setExecutionDate(undefined);
      setPaymentDate(undefined);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao criar serviço pontual:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Serviço Pontual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Criação de landing page"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva os detalhes do serviço..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9,]/g, '');
                handleInputChange('amount', value);
              }}
              placeholder="0,00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Execução *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !executionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {executionDate ? format(executionDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={executionDate}
                    onSelect={setExecutionDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Pagamento (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Serviço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}