'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Settings, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreateOrganizationModal } from "@/components/organization/CreateOrganizationModal";

export default function OrgSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizations, currentOrganization, setCurrentOrganization, loading, createOrganization } = useOrganizations(user?.id);
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectingOrgId, setSelectingOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSelectOrg = async (orgId: string) => {
    console.log('🔍 [DEBUG] Iniciando seleção de organização:', { orgId, totalOrgs: organizations.length });
    
    const userOrg = organizations.find(o => o.organization_id === orgId);
    console.log('🔍 [DEBUG] Organização encontrada:', userOrg);
    
    if (userOrg && userOrg.organization) {
      try {
        setSelectingOrgId(orgId);
        console.log('🔄 [DEBUG] Definindo organização atual...');
        await setCurrentOrganization(userOrg.organization);
        
        // Delay maior para garantir sincronização completa
        setTimeout(() => {
          // Verificar se a organização foi realmente salva no localStorage
          const savedOrg = localStorage.getItem('currentOrganization');
          if (savedOrg) {
            const parsedOrg = JSON.parse(savedOrg);
            if (parsedOrg.id === userOrg.organization.id) {
              navigate('/');
            } else {
              console.warn('Organização não foi salva corretamente, tentando novamente...');
              localStorage.setItem('currentOrganization', JSON.stringify(userOrg.organization));
              navigate('/');
            }
          } else {
            console.warn('Organização não encontrada no localStorage, salvando...');
            localStorage.setItem('currentOrganization', JSON.stringify(userOrg.organization));
            navigate('/');
          }
          setSelectingOrgId(null);
        }, 300);
      } catch (error) {
        console.error('Erro ao selecionar organização:', error);
        setSelectingOrgId(null);
        toast({
          title: "Erro",
          description: "Não foi possível selecionar a organização. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      console.log('❌ [DEBUG] Organização não encontrada ou inválida');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível acessar a organização selecionada.'
      });
    }
  };

  const handleCreateOrg = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateOrganization = async (name: string) => {
    try {
      const newOrg = await createOrganization(name);
      if (newOrg) {
        toast({
          title: 'Organização criada!',
          description: `A organização "${newOrg.name}" foi criada com sucesso.`
        });
        // Selecionar automaticamente a nova organização
        setCurrentOrganization(newOrg);
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a organização.',
        variant: 'destructive'
      });
      throw error; // Re-throw para que o modal possa lidar com o erro
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador': return 'success';
      case 'gerente': return 'warning';
      case 'financeiro': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 p-4">
      <div className="container max-w-4xl mx-auto pt-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Looki</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Escolha sua organização</h2>
          <p className="text-muted-foreground">
            Selecione a agência que deseja acessar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando organizações...</span>
            </div>
          ) : organizations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhuma organização encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você ainda não possui organizações. Crie uma para começar.
              </p>
            </div>
          ) : (
            organizations.map((userOrg) => (
              <Card 
                key={userOrg.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  currentOrganization?.id === userOrg.organization_id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectOrg(userOrg.organization_id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Building2 className="h-8 w-8 text-primary" />
                    <Badge variant={getRoleColor(userOrg.role) as any}>
                      {userOrg.role}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{userOrg.organization?.name || 'Organização'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      1 membro
                    </div>
                    {currentOrganization?.id === userOrg.organization_id && (
                      <Badge variant="outline" className="text-xs">
                        Ativa
                      </Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4"
                    variant={currentOrganization?.id === userOrg.organization_id ? "default" : "outline"}
                    disabled={selectingOrgId === userOrg.organization_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOrg(userOrg.organization_id);
                    }}
                  >
                    {selectingOrgId === userOrg.organization_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Acessando...
                      </>
                    ) : (
                      'Acessar'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}

          {/* Create new organization card */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg border-dashed"
            onClick={handleCreateOrg}
          >
            <CardHeader className="text-center py-12">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-lg text-muted-foreground">
                Nova Organização
              </CardTitle>
              <CardDescription>
                Criar uma nova agência
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/login")}>
            Fazer logout
          </Button>
        </div>
      </div>

      <CreateOrganizationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateOrganization={handleCreateOrganization}
      />
    </div>
  );
}