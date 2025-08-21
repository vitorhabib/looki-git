import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { createClient, updateClient, clients, loading } = useClients();
  const { currentOrganization } = useAuth();
  const isEditing = Boolean(id);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
    clientType: "company",
    status: "active" as "active" | "inactive" | "defaulter"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load client data when editing
  useEffect(() => {
    if (isEditing && id && clients.length > 0) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setFormData({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          document: client.document || "",
          address: client.address || "",
          city: client.city || "",
          state: client.state || "",
          zipCode: client.zip_code || "",
          notes: "", // Notes field doesn't exist in client data
          clientType: "company", // Default type
          status: client.status || "active"
        });
      }
    }
  }, [isEditing, id, clients]);

  // Validation functions
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : '';
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email inválido' : '';
      }
      case 'phone': {
        const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
        return value && !phoneRegex.test(value.replace(/\D/g, '')) ? 'Telefone inválido' : '';
      }
      case 'document':
        if (value) {
          const cleanDoc = value.replace(/\D/g, '');
          if (formData.clientType === 'company') {
            return cleanDoc.length !== 14 ? 'CNPJ deve ter 14 dígitos' : '';
          } else {
            return cleanDoc.length !== 11 ? 'CPF deve ter 11 dígitos' : '';
          }
        }
        return '';
      case 'zipCode': {
        const zipRegex = /^\d{5}-?\d{3}$/;
        return value && !zipRegex.test(value) ? 'CEP inválido' : '';
      }
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    else newErrors.name = validateField('name', formData.name);
    
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    else newErrors.email = validateField('email', formData.email);
    
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    else newErrors.phone = validateField('phone', formData.phone);
    
    // Optional fields validation
    newErrors.document = validateField('document', formData.document);
    newErrors.zipCode = validateField('zipCode', formData.zipCode);
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if organization is loaded
    if (!currentOrganization) {
      toast({
        title: "Organização não encontrada",
        description: "Aguarde o carregamento da organização ou faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Preparar dados para o Supabase
      const clientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        document: formData.document || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zipCode || undefined,
        country: "Brasil", // Default country
        status: formData.status,
      };

      if (isEditing && id) {
        await updateClient(id, clientData);
        toast({
          title: "Cliente atualizado com sucesso!",
          description: `Cliente ${formData.name} foi atualizado no sistema.`,
        });
      } else {
        await createClient(clientData);
        toast({
          title: "Cliente criado com sucesso!",
          description: `Cliente ${formData.name} foi adicionado ao sistema.`,
        });
      }
      
      // Redirect to clients list
      setTimeout(() => {
        navigate("/clients");
      }, 1000);
    } catch (error) {
      toast({
        title: isEditing ? "Erro ao atualizar cliente" : "Erro ao criar cliente",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const getFieldError = (field: string) => {
    return touched[field] && errors[field] ? errors[field] : '';
  };

  const isFieldValid = (field: string) => {
    return Boolean(touched[field] && !errors[field] && formData[field as keyof typeof formData]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? "Editar Cliente" : "Novo Cliente"}</h1>
            <p className="text-muted-foreground">
              {isEditing ? "Edite as informações do cliente" : "Cadastre um novo cliente para sua agência"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientType">Tipo de Cliente</Label>
                      <Select value={formData.clientType} onValueChange={(value) => handleChange("clientType", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company">Empresa</SelectItem>
                          <SelectItem value="individual">Pessoa Física</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange("status", value as "active" | "inactive" | "defaulter")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Desativado</SelectItem>
                          <SelectItem value="defaulter">Inadimplente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">
                        {formData.clientType === 'company' ? 'CNPJ' : 'CPF'}
                      </Label>
                      <Input
                        id="document"
                        placeholder={formData.clientType === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                        value={formData.document}
                        onChange={(e) => handleChange("document", e.target.value)}
                        onBlur={() => handleBlur('document')}
                        className={getFieldError('document') ? 'border-red-500' : isFieldValid('document') ? 'border-green-500' : ''}
                      />
                      {getFieldError('document') && (
                        <p className="text-sm text-destructive mt-1">{getFieldError('document')}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">
                      Nome da Empresa/Cliente
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Tech Solutions Ltda"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={getFieldError('name') ? 'border-red-500' : isFieldValid('name') ? 'border-green-500' : ''}
                      required
                    />
                    {getFieldError('name') && (
                      <p className="text-sm text-destructive mt-1">{getFieldError('name')}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="required">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@empresa.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={getFieldError('email') ? 'border-red-500' : isFieldValid('email') ? 'border-green-500' : ''}
                        required
                      />
                      {getFieldError('email') && (
                        <p className="text-sm text-destructive mt-1">{getFieldError('email')}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="required">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={getFieldError('phone') ? 'border-red-500' : isFieldValid('phone') ? 'border-green-500' : ''}
                        required
                      />
                      {getFieldError('phone') && (
                        <p className="text-sm text-destructive mt-1">{getFieldError('phone')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, complemento"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        placeholder="00000-000"
                        value={formData.zipCode}
                        onChange={(e) => handleChange("zipCode", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas internas</Label>
                    <Textarea
                      id="notes"
                      placeholder="Informações adicionais sobre o cliente..."
                      className="min-h-[120px]"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!currentOrganization && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                      <Building2 className="h-4 w-4" />
                      <span>Nenhuma organização selecionada</span>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || loading || !currentOrganization}
                    variant="default"
                  >
                    {isSubmitting || loading ? "Salvando..." : !currentOrganization ? "Carregando organização..." : (isEditing ? "Atualizar Cliente" : "Salvar Cliente")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/clients")}
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}