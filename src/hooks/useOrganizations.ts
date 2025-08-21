import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface Organization {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface UserOrganization {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  organization?: Organization
}

interface UseOrganizationsReturn {
  organizations: UserOrganization[]
  currentOrganization: Organization | null
  loading: boolean
  error: string | null
  loadUserOrganizations: () => Promise<void>
  setCurrentOrganization: (org: Organization) => void
  createOrganization: (name: string) => Promise<Organization | null>
  updateOrganization: (orgId: string, data: Partial<Organization>) => Promise<Organization | null>
  deleteOrganization: (orgId: string) => Promise<boolean>
}

export const useOrganizations = (userId?: string): UseOrganizationsReturn => {
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(() => {
    // Recuperar do localStorage na inicialização
    try {
      const saved = localStorage.getItem('currentOrganization')
      console.log('🔄 [DEBUG] Inicializando currentOrganization do localStorage:', saved);
      
      if (!saved) {
        console.log('📦 [DEBUG] Nenhuma organização salva no localStorage');
        return null;
      }
      
      const parsed = JSON.parse(saved);
      
      // Verificar se a organização tem as propriedades necessárias
      if (parsed && parsed.id && parsed.name) {
        console.log('📦 [DEBUG] currentOrganization válida inicializada:', parsed);
        return parsed;
      } else {
        console.log('⚠️ [DEBUG] Organização inválida no localStorage, removendo:', parsed);
        localStorage.removeItem('currentOrganization');
        return null;
      }
    } catch (error) {
      console.log('❌ [DEBUG] Erro ao recuperar currentOrganization do localStorage:', error);
      localStorage.removeItem('currentOrganization');
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUserOrganizations = useCallback(async () => {
    if (!userId) {
      console.log('👤 Nenhum userId fornecido para carregar organizações')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Carregando organizações para o usuário:', userId)
      
      // Primeiro, verificar se as tabelas existem
      const { data: userOrgsData, error: fetchError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userId)

      if (fetchError) {
        // Se as tabelas não existem ainda, mostrar erro
        if (fetchError.code === '42P01' || fetchError.code === 'PGRST200') { // Tabela não existe ou erro de relacionamento
          console.log('📝 Tabelas de organização não existem')
          setOrganizations([])
          
          toast({
            title: 'Erro de Configuração',
            description: 'As tabelas de organização não foram criadas. Execute as migrações do Supabase.',
            variant: 'destructive'
          })
          
          return
        }
        
        // Log apenas para erros inesperados
        console.error('❌ Erro inesperado ao carregar organizações:', fetchError)
        throw fetchError
      }

      // Se chegou aqui, as tabelas existem, agora buscar as organizações
      console.log('📊 [DEBUG] userOrgsData encontrada:', userOrgsData);
      
      if (userOrgsData && userOrgsData.length > 0) {
        const orgIds = userOrgsData.map(uo => uo.organization_id)
        console.log('🔍 [DEBUG] IDs das organizações:', orgIds);
        
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds)
          
        console.log('🏢 [DEBUG] Dados das organizações:', orgsData);
        
        if (orgsError) {
          console.error('❌ Erro ao carregar dados das organizações:', orgsError)
          throw orgsError
        }
        
        // Combinar os dados
        const combinedData = userOrgsData.map(userOrg => {
          const org = orgsData?.find(org => org.id === userOrg.organization_id) || null;
          console.log(`🔗 [DEBUG] Combinando userOrg ${userOrg.id} com org:`, org);
          return {
            ...userOrg,
            organization: org
          };
        });
        
        console.log('✅ [DEBUG] Organizações combinadas finais:', combinedData);
        setOrganizations(combinedData)
      } else {
        console.log('📝 Nenhuma organização encontrada para o usuário')
        setOrganizations([])
      }
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar organizações'
      setError(errorMessage)
      console.error('❌ Erro ao carregar organizações:', err)
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Carregar organizações quando o userId mudar
  useEffect(() => {
    console.log('🔄 [DEBUG] useEffect userId mudou:', { userId, hasUserId: !!userId, userIdType: typeof userId });
    
    // Só executar se userId for uma string válida
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      console.log('👤 [DEBUG] Carregando organizações para userId:', userId);
      loadUserOrganizations()
    } else if (userId === null || userId === undefined) {
      console.log('🗑️ [DEBUG] UserId é null/undefined - aguardando inicialização');
      // Não limpar estados imediatamente, aguardar inicialização
    } else {
      console.log('⚠️ [DEBUG] UserId inválido:', userId);
      // Limpar estados apenas se userId for explicitamente inválido
      setOrganizations([])
    }
  }, [userId, loadUserOrganizations])

  // Limpar estados quando o usuário faz logout (userId muda de string para null)
  useEffect(() => {
    // Se userId mudou de uma string válida para null/undefined, limpar estados
    if (userId === null) {
      console.log('🚪 [DEBUG] Usuário fez logout - limpando estados');
      setOrganizations([])
      setCurrentOrganizationState(null)
      localStorage.removeItem('currentOrganization')
    }
  }, [userId])

  const setCurrentOrganization = useCallback((org: Organization) => {
    console.log('🔄 [DEBUG] setCurrentOrganization chamado com:', org);
    setCurrentOrganizationState(org)
    // Persistir no localStorage
    localStorage.setItem('currentOrganization', JSON.stringify(org))
    console.log('💾 [DEBUG] Organização salva no localStorage:', JSON.stringify(org));
  }, [])

  const createOrganization = useCallback(async (name: string): Promise<Organization | null> => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado',
      })
      return null
    }

    setLoading(true)
    
    try {
      console.log('🔄 Criando nova organização:', name)
      
      // Criar a organização
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name,
          created_by: userId
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Associar o usuário como owner
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: newOrg.id,
          role: 'owner'
        })

      if (userOrgError) {
        throw userOrgError
      }

      console.log('✅ Organização criada:', newOrg.name)
      
      toast({
        title: 'Sucesso',
        description: `Organização "${name}" criada com sucesso!`,
      })

      // Recarregar as organizações
      await loadUserOrganizations()
      
      // Definir a nova organização como atual
      setCurrentOrganizationState(newOrg)
      
      return newOrg
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar organização'
      console.error('❌ Erro ao criar organização:', err)
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateOrganization = useCallback(async (orgId: string, data: Partial<Organization>): Promise<Organization | null> => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado',
      })
      return null
    }

    setLoading(true)
    
    try {
      console.log('🔄 Atualizando organização:', orgId, data)
      
      const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Erro ao atualizar organização:', error)
        throw error
      }
      
      console.log('✅ Organização atualizada:', updatedOrg)
      
      // Atualizar a organização atual se for a mesma
      if (currentOrganization?.id === orgId) {
        setCurrentOrganizationState(updatedOrg)
      }
      
      // Atualizar a lista de organizações
      setOrganizations(prev => prev.map(userOrg => 
        userOrg.organization?.id === orgId 
          ? { ...userOrg, organization: updatedOrg }
          : userOrg
      ))
      
      toast({
        title: 'Sucesso',
        description: 'Informações da organização atualizadas com sucesso!',
      })
      
      return updatedOrg
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar organização'
      console.error('❌ Erro ao atualizar organização:', err)
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [userId, currentOrganization])

  const deleteOrganization = useCallback(async (orgId: string): Promise<boolean> => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado',
      })
      return false
    }

    setLoading(true)
    
    try {
      console.log('🗑️ Excluindo organização:', orgId)
      
      // Verificar se o usuário é owner da organização
      const { data: userOrg, error: checkError } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .single()
      
      if (checkError || !userOrg || userOrg.role !== 'owner') {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Apenas o proprietário pode excluir a organização',
        })
        return false
      }
      
      // Excluir a organização (cascata será tratada pelo banco)
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)
      
      if (deleteError) {
        console.error('❌ Erro ao excluir organização:', deleteError)
        throw deleteError
      }
      
      console.log('✅ Organização excluída com sucesso')
      
      // Se a organização excluída era a atual, limpar
      if (currentOrganization?.id === orgId) {
        setCurrentOrganizationState(null)
        localStorage.removeItem('currentOrganization')
      }
      
      // Recarregar organizações
      await loadUserOrganizations()
      
      toast({
        title: 'Sucesso',
        description: 'Organização e todos os dados relacionados foram excluídos com sucesso!',
      })
      
      return true
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir organização'
      console.error('❌ Erro ao excluir organização:', err)
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
      
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, currentOrganization, loadUserOrganizations])

  return {
    organizations,
    currentOrganization,
    loading,
    error,
    loadUserOrganizations,
    setCurrentOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization
  }
}