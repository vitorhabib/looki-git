import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, AuthUser, supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useOrganizations, Organization } from '@/hooks/useOrganizations'


interface AuthContextType {
  user: AuthUser | null
  currentOrganization: Organization | null
  loading: boolean
  isMasterAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  setCurrentOrganization: (org: Organization) => void
  createOrganization: (name: string) => Promise<Organization | null>
  updateOrganization: (orgId: string, data: Partial<Organization>) => Promise<Organization | null>
  updateProfile: (data: { full_name?: string; phone?: string; address?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)
  const { toast } = useToast()
  
  // Hook de organizações
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    createOrganization,
    updateOrganization,
    loadUserOrganizations
  } = useOrganizations(user?.id);
  
  // Debug: Log da organização atual
  useEffect(() => {
    console.log('🏢 [DEBUG] AuthContext - currentOrganization mudou:', currentOrganization);
  }, [currentOrganization]);  


  // Função para verificar se o usuário é master admin - TEMPORARIAMENTE DESABILITADA
  const checkMasterAdmin = async (userId: string) => {
    // Sistema de master admin temporariamente desabilitado
    return false
    
    /* CÓDIGO ORIGINAL COMENTADO
    try {
      const { data, error } = await supabase
        .from('master_admins')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar master admin:', error)
        return false
      }
      
      return !!data
    } catch (error) {
      console.error('Erro ao verificar master admin:', error)
      return false
    }
    */
  }

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user as AuthUser)
          // const isAdmin = await checkMasterAdmin(session.user.id)
          // setIsMasterAdmin(isAdmin)
          setIsMasterAdmin(false) // Temporariamente desabilitado
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user as AuthUser)
        // const isAdmin = await checkMasterAdmin(session.user.id)
        // setIsMasterAdmin(isAdmin)
        setIsMasterAdmin(false) // Temporariamente desabilitado
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsMasterAdmin(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Função para verificar e criar organização padrão para novos usuários
  const checkAndCreateDefaultOrganization = async (user: AuthUser) => {
    try {
      // Aguardar um pouco para garantir que as organizações foram carregadas
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar se o usuário tem organizações
      const { data: userOrgs, error } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('❌ Erro ao verificar organizações do usuário:', error)
        return
      }
      
      // Se não tem organizações, criar uma automática
      if (!userOrgs || userOrgs.length === 0) {
        console.log('🏢 Usuário sem organizações, criando organização automática')
        
        const companyName = user.user_metadata?.company_name || 
                           user.user_metadata?.full_name ? `Empresa de ${user.user_metadata.full_name}` :
                           'Minha Empresa'
        
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
        
        const newOrg = await createOrganization(companyName)
        
        if (newOrg) {
          console.log('✅ Organização automática criada:', newOrg)
          toast({
            title: 'Bem-vindo!',
            description: `Sua organização "${newOrg.name}" foi criada automaticamente.`
          })
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar/criar organização automática:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        let errorMessage = 'Erro ao fazer login'
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login'
        } else if (error.message.includes('Invalid API key') || error.message.includes('Invalid URL')) {
          errorMessage = 'Configuração do Supabase inválida. Verifique suas credenciais.'
        }
        
        toast({
          title: 'Erro no login',
          description: errorMessage,
          variant: 'destructive'
        })
        
        return { success: false, error: errorMessage }
      }
      
      if (data.user) {
        setUser(data.user as AuthUser)
        

        
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo de volta, ${data.user.email}!`
        })
        return { success: true }
      }
      
      return { success: false, error: 'Erro desconhecido' }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao fazer login'
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    try {
      setLoading(true)
      const { data, error } = await auth.signUp(email, password, {
        full_name: fullName,
        company_name: companyName
      })
      
      if (error) {
        let errorMessage = 'Erro ao criar conta'
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido'
        } else if (error.message.includes('Invalid API key') || error.message.includes('Invalid URL')) {
          errorMessage = 'Configuração do Supabase inválida. Verifique suas credenciais.'
        }
        
        toast({
          title: 'Erro no cadastro',
          description: errorMessage,
          variant: 'destructive'
        })
        
        return { success: false, error: errorMessage }
      }
      
      if (data.user) {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu email para confirmar a conta. Sua organização será criada automaticamente no primeiro login.'
        })
        return { success: true }
      }
      
      return { success: false, error: 'Erro desconhecido' }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao criar conta'
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const currentUser = user
      const { error } = await auth.signOut()
      
      if (error) {
        // Error during logout:
        //   user_id: currentUser?.id,
        //   error_details: error
        // })
        toast({
          title: 'Erro ao sair',
          description: 'Não foi possível fazer logout',
          variant: 'destructive'
        })
      } else {
        setUser(null)
        // Limpar organização atual do localStorage
        localStorage.removeItem('currentOrganization')
        console.log('🗑️ [DEBUG] localStorage limpo no logout')
        toast({
          title: 'Logout realizado',
          description: 'Você foi desconectado com sucesso'
        })
      }
    } catch (error) {
      
      toast({
        title: 'Erro ao sair',
        description: 'Erro inesperado ao fazer logout',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await auth.resetPassword(email)
      
      if (error) {
        let errorMessage = 'Erro ao enviar email de recuperação'
        
        if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido'
        }
        
        toast({
          title: 'Erro na recuperação',
          description: errorMessage,
          variant: 'destructive'
        })
        
        return { success: false, error: errorMessage }
      }
      
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.'
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao enviar email'
      toast({
        title: 'Erro na recuperação',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  const updateProfile = async (data: { full_name?: string; phone?: string; address?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: data
      })

      if (error) {
        let errorMessage = 'Erro ao atualizar perfil'
        
        toast({
          title: 'Erro na atualização',
          description: errorMessage,
          variant: 'destructive'
        })
        
        return { success: false, error: errorMessage }
      }
      
      // Atualizar o estado local do usuário
      if (user) {
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...data
          }
        })
      }
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.'
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = 'Erro inesperado ao atualizar perfil'
      toast({
        title: 'Erro na atualização',
        description: errorMessage,
        variant: 'destructive'
      })
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    currentOrganization,
    loading,
    isMasterAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    setCurrentOrganization,
    createOrganization,
    updateOrganization,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}