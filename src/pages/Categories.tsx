import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FolderKanban, 
  Plus, 
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Receipt,
  TrendingUp,
  Palette
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Dados removidos - agora usando dados reais do Supabase

const colorOptions = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#6b7280", label: "Cinza" },
  { value: "#14b8a6", label: "Teal" }
];

export default function Categories() {
  const { toast } = useToast();
  const { user, currentOrganization } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "expense" as const,
    color: "#3b82f6"
  });

  // Usar organização do usuário (por enquanto usando o ID do usuário como organização)
  const organizationId = currentOrganization?.id || null;
  
  const {
    expenseCategories,
    revenueCategories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories
  } = useCategories(organizationId);

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        type: category.type,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        type: "expense",
        color: "#3b82f6"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validação básica
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    let success = false;
    
    if (editingCategory) {
      // Atualizar categoria existente
      success = await updateCategory(editingCategory.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        color: formData.color
      });
    } else {
      // Criar nova categoria
      success = await createCategory({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        color: formData.color
      });
    }
    
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = [...expenseCategories, ...revenueCategories].find(cat => cat.id === categoryId);
    await deleteCategory(categoryId, category?.name);
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    await searchCategories(value);
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'expense' ? 'destructive' : 'default'}>
        {type === 'expense' ? 'Despesa' : 'Receita'}
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">
              Organize suas receitas e despesas por categorias
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando categorias...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Erro ao carregar categorias: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-500" />
              Categorias de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && expenseCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma categoria de despesa encontrada.
                      {searchTerm && " Tente ajustar sua busca."}
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseCategories.map((category) => (
                    <TableRow key={category.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-mono">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.expense_count || 0} itens</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(category.total_amount || 0)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                               className="text-destructive"
                               onClick={() => handleDeleteCategory(category.id)}
                             >
                               <Trash2 className="h-4 w-4 mr-2" />
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

        {/* Revenue Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Categorias de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma categoria de receita encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  revenueCategories.map((category) => (
                    <TableRow key={category.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-mono">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.revenue_count || 0} itens</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {(category.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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

        {/* Dialog for Add/Edit Category */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Edite as informações da categoria.' 
                  : 'Crie uma nova categoria para organizar suas receitas ou despesas.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Marketing Digital"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o que inclui nesta categoria"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Cor</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCategory ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}