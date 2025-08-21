import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ExpenseTableSkeleton } from "@/components/ui/table-skeleton";
import { useEffect, useState } from "react";
import { Plus, Receipt, Calendar, CreditCard, Edit, Trash2, DollarSign, TrendingUp, Clock, CheckCircle, Check } from "lucide-react";

const Expenses = () => {
  const { currentOrganization } = useAuth();
  const organizationId = currentOrganization?.id;
  const { expensesList, createExpense, updateExpense, deleteExpense, offlineQueueCount, syncOfflineExpenses, loading } = useExpenses(organizationId);
  const { expenseCategories } = useCategories(organizationId);
  const { toast } = useToast();
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [expenseStats, setExpenseStats] = useState({
    currentMonthTotal: 0,
    previousMonthTotal: 0,
    monthlyVariation: 0,
    pendingTotal: 0,
    paidTotal: 0
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category_id: '',
    expense_date: '',
    payment_method: 'credit_card',
    status: 'pending',
    is_recurring: false,
    recurring_frequency: 'monthly',
    recurring_start_date: '',
    recurring_end_date: ''
  });

  // Debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [logEntry, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthTotal = 0;
    let previousMonthTotal = 0;
    let pendingTotal = 0;
    let paidTotal = 0;

    expensesList.forEach(expense => {
      const expenseDate = new Date(expense.expense_date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      const amount = parseFloat(expense.amount.toString());

      // Total do mês atual
      if (expenseMonth === currentMonth && expenseYear === currentYear) {
        currentMonthTotal += amount;
      }

      // Total do mês anterior
      if (expenseMonth === previousMonth && expenseYear === previousYear) {
        previousMonthTotal += amount;
      }

      // Totais por status
      if (expense.status === 'pending') {
        pendingTotal += amount;
      } else if (expense.status === 'paid') {
        paidTotal += amount;
      }
    });

    const monthlyVariation = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    setExpenseStats({
      currentMonthTotal,
      previousMonthTotal,
      monthlyVariation,
      pendingTotal,
      paidTotal
    });
  };

  // Recalcular estatísticas quando a lista de despesas mudar
  useEffect(() => {
    calculateStats();
  }, [expensesList]);

  // Função para buscar o nome da categoria
  const getCategoryName = (categoryId: string) => {
    const category = expenseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoria não encontrada';
  };

  const handleOpenDialog = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      category_id: "",
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: "credit_card",
      status: "pending",
      is_recurring: false,
      recurring_frequency: "monthly",
      recurring_start_date: "",
      recurring_end_date: ""
    });
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    addDebugLog(`✏️ Editando despesa: ${expense.title}`);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      status: expense.status,
      is_recurring: expense.is_recurring || false,
      recurring_frequency: expense.recurring_frequency || 'monthly',
      recurring_start_date: expense.recurring_start_date || '',
      recurring_end_date: expense.recurring_end_date || ''
    });
    setEditingExpense(expense.id);
    setIsDialogOpen(true);
  };

  const handleCancelEdit = () => {
    addDebugLog('❌ Edição cancelada - formulário resetado');
    setFormData({
      title: "",
      description: "",
      amount: "",
      category_id: "",
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: "credit_card",
      status: "pending",
      is_recurring: false,
      recurring_frequency: "monthly",
      recurring_start_date: "",
      recurring_end_date: ""
    });
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleDeleteExpense = async (expenseId: string, expenseTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a despesa "${expenseTitle}"?`)) {
      addDebugLog(`🗑️ Excluindo despesa: ${expenseTitle}`);
      const success = await deleteExpense(expenseId, expenseTitle);
      if (success) {
        addDebugLog('✅ Despesa excluída com sucesso');
        toast({
          title: "Despesa excluída",
          description: "A despesa foi excluída com sucesso.",
        });
      } else {
        addDebugLog(`❌ Erro ao excluir despesa: ${expenseTitle}`);
      }
    }
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    addDebugLog(`💰 Marcando despesa como paga: ${expenseId}`);
    const success = await updateExpense(expenseId, { status: 'paid' });
    if (success) {
      addDebugLog('✅ Despesa marcada como paga com sucesso');
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi marcada como paga.",
      });
    } else {
      addDebugLog(`❌ Erro ao marcar despesa como paga: ${expenseId}`);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a despesa como paga.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
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
      if (editingExpense) {
        addDebugLog(`🔄 Atualizando despesa: ${formData.title} - R$ ${formData.amount}`);
        result = await updateExpense(editingExpense, expenseData);
      } else {
        addDebugLog(`➕ Criando nova despesa: ${formData.title} - R$ ${formData.amount}`);
        result = await createExpense(expenseData);
      }

      if (result) {
        addDebugLog(editingExpense ? '✅ Despesa atualizada com sucesso' : '✅ Despesa criada com sucesso');
        toast({
          title: editingExpense ? "Despesa atualizada" : "Despesa criada",
          description: editingExpense ? "A despesa foi atualizada com sucesso." : "A despesa foi criada com sucesso.",
        });
        // Resetar formulário ANTES de fechar o dialog
        setFormData({
          title: "",
          description: "",
          amount: "",
          category_id: "",
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: "credit_card",
          status: "pending",
          is_recurring: false,
          recurring_frequency: "monthly",
          recurring_start_date: "",
          recurring_end_date: ""
        });
        setIsDialogOpen(false);
        setEditingExpense(null);
        addDebugLog('🔄 Formulário resetado');
      }
    } catch (error) {
      addDebugLog(`❌ Erro ao salvar despesa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a despesa. Tente novamente.",
        variant: "destructive",
      });
      // Não resetar formulário em caso de erro - manter dados do usuário
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Despesas</h1>
            <p className="text-muted-foreground">Gerencie suas despesas e gastos</p>
          </div>
          <div className="flex items-center gap-4">
            {offlineQueueCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                  📱 {offlineQueueCount} offline
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addDebugLog('🔄 Iniciando sincronização offline...');
                    syncOfflineExpenses();
                  }}
                >
                  Sincronizar
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugLogs(!showDebugLogs)}
            >
              {showDebugLogs ? '🔍 Ocultar Logs' : '🔍 Ver Logs'}
            </Button>
            <Button variant="default" onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {/* Widgets de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total do Mês</p>
                  <p className="text-2xl font-bold">R$ {expenseStats.currentMonthTotal.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Variação Mensal</p>
                  <p className={`text-2xl font-bold ${
                    expenseStats.monthlyVariation > 0 ? 'text-red-600' : 
                    expenseStats.monthlyVariation < 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {expenseStats.monthlyVariation > 0 ? '+' : ''}{expenseStats.monthlyVariation.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${
                  expenseStats.monthlyVariation > 0 ? 'text-red-600' : 
                  expenseStats.monthlyVariation < 0 ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">R$ {expenseStats.pendingTotal.toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Pagas</p>
                  <p className="text-2xl font-bold text-green-600">R$ {expenseStats.paidTotal.toFixed(2)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Lista de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <></>  
            ) : expensesList.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Quando você adicionar uma despesa ela aparecerá aqui!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recorrência</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesList.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryName(expense.category_id)}
                        </span>
                      </TableCell>
                      <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.status}</TableCell>
                      <TableCell>
                        {expense.is_recurring ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {expense.recurring_frequency === 'monthly' ? 'Mensal' : 
                             expense.recurring_frequency === 'quarterly' ? 'Trimestral' : 'Anual'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expense.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsPaid(expense.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Marcar como paga"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id, expense.title)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
              <ExpenseTableSkeleton />
            </div>
          )}
        </Card>

        {/* Debug Logs Section */}
        {showDebugLogs && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  🔍 Debug Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Status: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDebugLogs([])}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 rounded p-3 max-h-60 overflow-y-auto font-mono text-sm">
                {debugLogs.length === 0 ? (
                  <p className="text-gray-500">Nenhum log ainda...</p>
                ) : (
                  debugLogs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog for Add Expense */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          } else {
            setIsDialogOpen(open);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {editingExpense ? "Editar Despesa" : "Nova Despesa"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? "Edite os dados da despesa." : "Adicione uma nova despesa ao seu controle financeiro."}
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
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingExpense ? "Atualizar Despesa" : "Criar Despesa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;