import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, Client } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess?: () => void;
}

export function ClientModal({ open, onOpenChange, client, onSuccess }: ClientModalProps) {
  const { toast } = useToast();
  const { currentOrganization } = useAuth();
  const organizationId = currentOrganization?.id;
  const { createClient, updateClient } = useClients();

  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          document: client.document || '',
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          zip_code: client.zip_code || ''
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          document: '',
          address: '',
          city: '',
          state: '',
          zip_code: ''
        });
      }
    }
  }, [open, client]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "O email do cliente é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (client) {
        await updateClient(client.id, formData);
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso!"
        });
      } else {
        await createClient(formData);
        toast({
          title: "Sucesso",
          description: "Cliente criado com sucesso!"
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o cliente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {client ? 'Edite os dados do cliente.' : 'Cadastre um novo cliente para sua organização.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome do cliente"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Rua, número, complemento"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                placeholder="SP"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                placeholder="00000-000"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (client ? 'Atualizar' : 'Criar')} Cliente
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