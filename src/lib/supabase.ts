import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jjqhgvnzjwkhsrebcjvn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcWhndm56andraHNyZWJjanZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MTEyOTMsImV4cCI6MjA2Njk4NzI5M30.3lQZZ1l0umn1PWtS7EcoFvkZBgB9pZcqYZg92LhhXhw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para autenticação
export interface AuthUser {
  id: string
  email: string
  created_at?: string
  user_metadata: {
    full_name?: string
    company_name?: string
    avatar_url?: string
    phone?: string
    address?: string
  }
}

// Funções de autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Registro com email e senha
  signUp: async (email: string, password: string, metadata?: { full_name?: string, company_name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset de senha
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }
}

// Tipos para categorias
export interface Category {
  id: string
  name: string
  description: string
  type: 'expense' | 'revenue'
  color: string
  organization_id: string
  created_at: string
  updated_at: string
  expense_count?: number
  revenue_count?: number
  total_amount?: number
}

export interface CreateCategoryData {
  name: string
  description: string
  type: 'expense' | 'revenue'
  color: string
  organization_id: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  type?: 'expense' | 'revenue'
  color?: string
}

// Tipos para despesas
export interface Expense {
  id: string
  title: string
  description: string
  amount: number
  category_id: string | null
  organization_id: string
  expense_date: string
  payment_method: string
  status: 'pending' | 'paid' | 'cancelled'
  receipt_url: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  category?: Category
  is_recurring?: boolean
  recurring_frequency?: 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  parent_expense_id?: string
  next_recurring_date?: string
}

export interface CreateExpenseData {
  title: string
  description: string
  amount: number
  category_id?: string
  organization_id: string
  expense_date: string
  payment_method: string
  status?: 'pending' | 'paid' | 'cancelled'
  receipt_url?: string
  tags?: string[]
  is_recurring?: boolean
  recurring_frequency?: 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  next_recurring_date?: string
}

export interface UpdateExpenseData {
  title?: string
  description?: string
  amount?: number
  category_id?: string
  expense_date?: string
  payment_method?: string
  status?: 'pending' | 'paid' | 'cancelled'
  receipt_url?: string
  tags?: string[]
  is_recurring?: boolean
  recurring_frequency?: 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  next_recurring_date?: string
}

// Funções para gerenciar categorias
export const categories = {
  // Listar todas as categorias de uma organização
  getByOrganization: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
    
    return { data, error }
  },

  // Criar nova categoria
  create: async (categoryData: CreateCategoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single()
    
    return { data, error }
  },

  // Atualizar categoria
  update: async (id: string, categoryData: UpdateCategoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...categoryData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Excluir categoria
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  // Buscar categorias por nome
  search: async (organizationId: string, searchTerm: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', `%${searchTerm}%`)
      .order('name')
    
    return { data, error }
  },

  // Obter categorias por tipo
   getByType: async (organizationId: string, type: 'expense' | 'revenue') => {
     const { data, error } = await supabase
       .from('categories')
       .select('*')
       .eq('organization_id', organizationId)
       .eq('type', type)
       .order('name')
     
     return { data, error }
   }
  }

// Funções para gerenciar despesas
export const expenses = {
  // Listar todas as despesas de uma organização
  getByOrganization: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .order('expense_date', { ascending: false })
    
    return { data, error }
  },

  // Criar nova despesa
  create: async (expenseData: CreateExpenseData) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select(`
        *,
        category:categories(*)
      `)
      .single()
    
    return { data, error }
  },

  // Atualizar despesa
  update: async (id: string, expenseData: UpdateExpenseData) => {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...expenseData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()
    
    return { data, error }
  },

  // Excluir despesa
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  // Buscar despesas por título ou descrição
  search: async (organizationId: string, searchTerm: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('expense_date', { ascending: false })
    
    return { data, error }
  },

  // Obter despesas por categoria
  getByCategory: async (organizationId: string, categoryId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .eq('category_id', categoryId)
      .order('expense_date', { ascending: false })
    
    return { data, error }
  },

  // Obter despesas por status
  getByStatus: async (organizationId: string, status: 'pending' | 'paid' | 'cancelled') => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', status)
      .order('expense_date', { ascending: false })
    
    return { data, error }
  },

  // Obter despesas por período
  getByDateRange: async (organizationId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('organization_id', organizationId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false })
    
    return { data, error }
  },

  // Obter estatísticas de despesas
  getStats: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, status, expense_date')
      .eq('organization_id', organizationId)
    
    return { data, error }
  }
}