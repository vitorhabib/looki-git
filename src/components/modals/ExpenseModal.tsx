import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from 'lucide-react';

interface ExpenseFormData {
  title: string;
  description: string;
  amount: string;
  category_id: string;
  expense_date: string;
  payment_method: string;
  status: string;
  is_recurring: boolean;
  recurring_frequency: string;
  recurring_start_date: string;
  recurring_end_date: string;
}

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSuccess?: () => void;
}

export function ExpenseModal({ open, onOpenChange, expense, onSuccess }: ExpenseModalProps) {
  const { toast } = useToast();
  const { currentOrganization } = useAuth();
  const organizationId = currentOrganization?.id;
  const { createExpense, updateExpense } = useExpenses(organizationId);
  const { expenseCategories } = useCategories(organizationId);

  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: '',
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'credit_card',
    status: 'pending',
    is_recurring: false,
    recurring_frequency: 'monthly',
    recurring_start_date: '',
    recurring_end_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        setFormData({
          title: expense.title || '',
          description: expense.description || '',
          amount: expense.amount.toString(),
          category_id: expense.category_id || '',
          expense_date: expense.expense_date,
          payment_method: expense.payment_method,
          status: expense.status,
          is_recurring: expense.is_recurring || false,
          recurring_frequency: expense.recurring_frequency || 'monthly',
          recurring_start_date: expense.recurring_start_date || '',
          recurring_end_date: expense.recurring_end_date || ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          amount: '',
          category_id: '',
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'credit_card',
          status: 'pending',
          is_recurring: false,
          recurring_frequency: 'monthly',
          recurring_start_date: '',
          recurring_end_date: ''
        });
      }
    }
  }, [open, expense]);

  const handleSubmit = async () => {
    // Validação básica
    if (!formData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título da despesa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro de validação",
        description: "O valor da despesa deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!organizationId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const expenseData = {
      title: formData.title,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id || undefined,
      organization_id: organizationId,
      expense_date: formData.expense_date,
      payment_method: formData.payment_method as 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'bank_transfer',
      status: formData.status as 'pending' | 'paid' | 'cancelled',
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency as 'monthly' | 'quarterly' | 'yearly' : undefined,
      recurring_start_date: formData.is_recurring && formData.recurring_start_date ? formData.recurring_start_date : undefined,
      recurring_end_date: formData.is_recurring && formData.recurring_end_date ? formData.recurring_end_date : undefined
    };

    try {
      let result;
      if (expense) {
        result = await updateExpense(expense.id, expenseData);
      } else {
        result = await createExpense(expenseData);
      }

      if (result) {
        toast({
          title: expense ? "Despesa atualizada" : "Despesa criada",
          description: expense ? "A despesa foi atualizada com sucesso." : "A despesa foi criada com sucesso.",
        });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a despesa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {expense ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
          <DialogDescription>
            {expense ? "Edite os dados da despesa." : "Adicione uma nova despesa ao seu controle financeiro."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Compra de material de escritório"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva os detalhes da despesa"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense_date">Data</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
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
            <div className="grid gap-2">
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Campos de Recorrência */}
          <div className="grid gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked as boolean})}
              />
              <Label htmlFor="is_recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Despesa recorrente
              </Label>
            </div>
            
            {formData.is_recurring && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recurring_frequency">Frequência</Label>
                    <Select value={formData.recurring_frequency} onValueChange={(value) => setFormData({...formData, recurring_frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recurring_start_date">Data de Início</Label>
                    <Input
                      id="recurring_start_date"
                      type="date"
                      value={formData.recurring_start_date}
                      onChange={(e) => setFormData({...formData, recurring_start_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurring_end_date">Data de Fim (opcional)</Label>
                  <Input
                    id="recurring_end_date"
                    type="date"
                    value={formData.recurring_end_date}
                    onChange={(e) => setFormData({...formData, recurring_end_date: e.target.value})}
                    placeholder="Deixe em branco para recorrência indefinida"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (expense ? "Atualizar Despesa" : "Criar Despesa")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}