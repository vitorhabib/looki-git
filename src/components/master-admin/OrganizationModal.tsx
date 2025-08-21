import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface Organization {
  id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  slug?: string;
  created_at?: string;
}

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization | null;
  onSuccess: () => void;
  mode: 'create' | 'edit' | 'suspend' | 'delete';
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess,
  mode
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Organization>({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (organization && (mode === 'edit' || mode === 'suspend' || mode === 'delete')) {
      setFormData({
        name: organization.name,
        description: organization.description || '',
        is_active: organization.is_active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
  }, [organization, mode, isOpen]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        const slug = generateSlug(formData.name);
        
        // Verificar se o slug já existe
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existingOrg) {
          toast({
            title: 'Erro',
            description: 'Já existe uma organização com este nome',
            variant: 'destructive'
          });
          return;
        }

        const { error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            description: formData.description,
            slug: slug,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Organização criada com sucesso'
        });
      } else if (mode === 'edit' && organization) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active
          })
          .eq('id', organization.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Organização atualizada com sucesso'
        });
      } else if (mode === 'suspend' && organization) {
        const { error } = await supabase
          .from('organizations')
          .update({ is_active: false })
          .eq('id', organization.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Organização suspensa com sucesso'
        });
      } else if (mode === 'delete' && organization) {
        // Verificar se há usuários ou dados relacionados
        const { data: users } = await supabase
          .from('organization_users')
          .select('id')
          .eq('organization_id', organization.id);

        if (users && users.length > 0) {
          toast({
            title: 'Erro',
            description: 'Não é possível excluir uma organização com usuários ativos',
            variant: 'destructive'
          });
          return;
        }

        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', organization.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Organização excluída com sucesso'
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao processar organização:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar a operação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Nova Organização';
      case 'edit': return 'Editar Organização';
      case 'suspend': return 'Suspender Organização';
      case 'delete': return 'Excluir Organização';
      default: return 'Organização';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'create': return 'Crie uma nova organização no sistema';
      case 'edit': return 'Edite as informações da organização';
      case 'suspend': return 'Tem certeza que deseja suspender esta organização?';
      case 'delete': return 'Esta ação não pode ser desfeita. Todos os dados da organização serão perdidos.';
      default: return '';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'create': return 'Criar';
      case 'edit': return 'Salvar';
      case 'suspend': return 'Suspender';
      case 'delete': return 'Excluir';
      default: return 'Confirmar';
    }
  };

  const getButtonVariant = () => {
    switch (mode) {
      case 'suspend': return 'secondary' as const;
      case 'delete': return 'destructive' as const;
      default: return 'default' as const;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          {(mode === 'create' || mode === 'edit') && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Organização</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome da organização"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da organização (opcional)"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Organização ativa</Label>
              </div>
            </div>
          )}
          
          {(mode === 'suspend' || mode === 'delete') && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Organização:</strong> {organization?.name}
              </p>
              {mode === 'delete' && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Esta ação é irreversível e excluirá todos os dados relacionados.
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant={getButtonVariant()}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};