import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface GlobalUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    company_name?: string;
    [key: string]: any;
  };
  organizations?: {
    id: string;
    name: string;
  }[];
  is_master_admin: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: GlobalUser | null;
  onSuccess: () => void;
  mode: 'create' | 'edit' | 'promote' | 'suspend' | 'delete';
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  mode
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    password: '',
    is_master_admin: false,
    selected_organization: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'promote' || mode === 'suspend' || mode === 'delete')) {
      setFormData({
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        company_name: user.user_metadata?.company_name || '',
        password: '',
        is_master_admin: user.is_master_admin,
        selected_organization: user.organizations?.[0]?.id || ''
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        company_name: '',
        password: '',
        is_master_admin: false,
        selected_organization: ''
      });
    }
  }, [user, mode, isOpen]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        // Criar usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            full_name: formData.full_name,
            company_name: formData.company_name
          },
          email_confirm: true
        });

        if (authError) throw authError;

        // Adicionar à organização se selecionada
        if (formData.selected_organization && authData.user) {
          const { error: orgError } = await supabase
            .from('organization_users')
            .insert({
              organization_id: formData.selected_organization,
              user_id: authData.user.id,
              role: 'member'
            });

          if (orgError) throw orgError;
        }

        // Definir como master admin se necessário
        if (formData.is_master_admin && authData.user) {
          const { error: masterError } = await supabase
            .from('master_admins')
            .insert({
              user_id: authData.user.id
            });

          if (masterError) throw masterError;
        }

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso'
        });
      } else if (mode === 'edit' && user) {
        // Atualizar metadados do usuário
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              full_name: formData.full_name,
              company_name: formData.company_name
            }
          }
        );

        if (updateError) throw updateError;

        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso'
        });
      } else if (mode === 'promote' && user) {
        if (formData.is_master_admin) {
          // Promover a master admin
          const { error } = await supabase
            .from('master_admins')
            .insert({ user_id: user.id });

          if (error && error.code !== '23505') throw error; // Ignorar se já existe

          toast({
            title: 'Sucesso',
            description: 'Usuário promovido a Master Admin'
          });
        } else {
          // Remover de master admin
          const { error } = await supabase
            .from('master_admins')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          toast({
            title: 'Sucesso',
            description: 'Privilégios de Master Admin removidos'
          });
        }
      } else if (mode === 'suspend' && user) {
        // Suspender usuário
        const { error } = await supabase.auth.admin.updateUserById(
          user.id,
          { ban_duration: '8760h' } // 1 ano em horas
        );

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário suspenso com sucesso'
        });
      } else if (mode === 'delete' && user) {
        // Verificar se é o último master admin
        if (user.is_master_admin) {
          const { data: masterAdmins } = await supabase
            .from('master_admins')
            .select('id');

          if (masterAdmins && masterAdmins.length <= 1) {
            toast({
              title: 'Erro',
              description: 'Não é possível excluir o último Master Admin',
              variant: 'destructive'
            });
            return;
          }
        }

        // Excluir usuário
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário excluído com sucesso'
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar a operação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Novo Usuário';
      case 'edit': return 'Editar Usuário';
      case 'promote': return 'Gerenciar Privilégios';
      case 'suspend': return 'Suspender Usuário';
      case 'delete': return 'Excluir Usuário';
      default: return 'Usuário';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'create': return 'Crie um novo usuário no sistema';
      case 'edit': return 'Edite as informações do usuário';
      case 'promote': return 'Gerencie os privilégios de administração';
      case 'suspend': return 'Tem certeza que deseja suspender este usuário?';
      case 'delete': return 'Esta ação não pode ser desfeita. O usuário será permanentemente excluído.';
      default: return '';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'create': return 'Criar';
      case 'edit': return 'Salvar';
      case 'promote': return formData.is_master_admin ? 'Promover' : 'Remover Privilégios';
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                  disabled={mode === 'edit'}
                  required
                />
              </div>
              
              {mode === 'create' && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha temporária"
                    required
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do usuário"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="company_name">Empresa</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              
              {mode === 'create' && (
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organização</Label>
                  <Select value={formData.selected_organization} onValueChange={(value) => setFormData({ ...formData, selected_organization: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_master_admin"
                  checked={formData.is_master_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_master_admin: checked })}
                />
                <Label htmlFor="is_master_admin">Master Admin</Label>
              </div>
            </div>
          )}
          
          {mode === 'promote' && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_master_admin"
                  checked={formData.is_master_admin}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_master_admin: checked })}
                />
                <Label htmlFor="is_master_admin">Master Admin</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Master Admins têm acesso total ao sistema e podem gerenciar todas as organizações.
              </p>
            </div>
          )}
          
          {(mode === 'suspend' || mode === 'delete') && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Usuário:</strong> {user?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Nome:</strong> {user?.user_metadata?.full_name || 'N/A'}
              </p>
              {mode === 'delete' && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Esta ação é irreversível e excluirá permanentemente o usuário.
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