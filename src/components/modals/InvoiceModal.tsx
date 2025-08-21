import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

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

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSuccess?: () => void;
}

export function InvoiceModal({ open, onOpenChange, invoice, onSuccess }: InvoiceModalProps) {
  const { toast } = useToast();
  const { currentOrganization } = useAuth();
  const organizationId = currentOrganization?.id;
  const { createInvoice, updateInvoice } = useInvoices();
  const { clients } = useClients();
  const { categories } = useCategories(organizationId);
  
  const revenueCategories = useMemo(() => {
    return categories.filter(cat => cat.type === 'revenue');
  }, [categories]);

  const [formData, setFormData] = useState<InvoiceFormData>({
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or invoice changes
  useEffect(() => {
    if (open) {
      if (invoice) {
        setFormData({
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
        setFormData({
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
    }
  }, [open, invoice]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título da fatura é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.client_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para a fatura.",
        variant: "destructive"
      });
      return;
    }

    if (formData.total_amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor total deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        ...formData,
        category_id: formData.category_id === 'no-category' ? null : formData.category_id,
        subtotal: formData.total_amount,
        tax_amount: 0,
        discount_amount: 0
      };

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast({
          title: "Sucesso",
          description: "Fatura atualizada com sucesso!"
        });
      } else {
        await createInvoice(invoiceData);
        toast({
          title: "Sucesso",
          description: "Fatura criada com sucesso!"
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a fatura. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Editar Fatura' : 'Nova Fatura'}
          </DialogTitle>
          <DialogDescription>
            {invoice ? 'Edite os dados da fatura.' : 'Crie uma nova fatura para seu cliente.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Fatura</Label>
            <Input
              id="title"
              placeholder="Ex: Desenvolvimento de Website, Consultoria Mensal..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="client_id">Cliente</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
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
            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
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
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
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
              value={formData.total_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
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
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          {/* Campos de Recorrência */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_recurring" className="text-sm font-medium">
                Fatura Recorrente
              </Label>
            </div>
            
            {formData.is_recurring && (
              <div className="space-y-3 pl-6">
                <div>
                  <Label htmlFor="recurring_frequency">Frequência</Label>
                  <Select 
                    value={formData.recurring_frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_frequency: value as 'monthly' | 'quarterly' | 'yearly' }))}
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
                      value={formData.recurring_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recurring_end_date">Data de Fim (Opcional)</Label>
                    <Input
                      id="recurring_end_date"
                      type="date"
                      value={formData.recurring_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (invoice ? 'Atualizar' : 'Criar')} Fatura
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}