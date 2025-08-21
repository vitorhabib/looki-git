import { useState, useEffect } from 'react'
import { categories, Category, CreateCategoryData, UpdateCategoryData } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Função utilitária para normalizar dados da categoria
const normalizeCategoryData = (data: any) => {
  const normalized = { ...data };
  
  // Converter campos vazios para undefined (exceto campos obrigatórios)
  Object.keys(normalized).forEach(key => {
    if (key !== 'name' && key !== 'type' && key !== 'organization_id') {
      if (normalized[key] === '' || normalized[key] === null) {
        normalized[key] = undefined;
      }
    }
  });
  
  return normalized;
};

// Função utilitária para validar tipo de categoria
const validateCategoryType = (type: string): boolean => {
  return ['expense', 'revenue'].includes(type);
};

export function useCategories(organizationId: string | null) {
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()



  // Carregar categorias
  const loadCategories = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('Carregando categorias para organização:', organizationId)
      const { data, error: supabaseError } = await categories.getByOrganization(organizationId)
      
      if (supabaseError) {
        console.error('Erro do Supabase:', supabaseError)
        throw new Error(supabaseError.message)
      }
      
      console.log('Categorias carregadas:', data)
      setCategoriesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias'
      console.error('Erro ao carregar categorias:', err)
      setError(errorMessage)
      setCategoriesList([])
    } finally {
      setLoading(false)
    }
  }

  // Criar categoria
  const createCategory = async (categoryData: Omit<CreateCategoryData, 'organization_id'>) => {
    if (!organizationId) {
      toast({
        title: 'Erro',
        description: 'Organização não selecionada',
        variant: 'destructive',
      })
      return false
    }

    try {
      // Validações básicas
      if (!categoryData.name?.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome da categoria é obrigatório',
          variant: 'destructive',
        })
        return false
      }

      if (!categoryData.type || !validateCategoryType(categoryData.type)) {
        toast({
          title: 'Erro de validação',
          description: 'Tipo de categoria inválido (deve ser "expense" ou "revenue")',
          variant: 'destructive',
        })
        return false
      }

      // Normalizar dados
      const normalizedData = normalizeCategoryData({
        ...categoryData,
        organization_id: organizationId
      })

      console.log('🔄 [useCategories] Criando categoria:', normalizedData)

      const { data, error: supabaseError } = await categories.create(normalizedData)
      
      if (supabaseError) {
        console.error('❌ [useCategories] Erro do Supabase:', supabaseError)
        throw new Error(supabaseError.message)
      }
      
      if (data) {
        console.log('✅ [useCategories] Categoria criada:', data)
        setCategoriesList(prev => [...prev, data])
        toast({
          title: 'Categoria criada com sucesso!',
          description: `A categoria "${data.name}" foi criada.`,
        })
        return true
      }
      
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria'
      console.error('❌ [useCategories] Erro ao criar categoria:', err)
      toast({
        title: 'Erro ao criar categoria',
        description: errorMessage,
        variant: 'destructive',
      })
      return false
    }
  }

  // Atualizar categoria
  const updateCategory = async (id: string, categoryData: UpdateCategoryData) => {
    try {
      // Validações básicas se os campos estão sendo atualizados
      if (categoryData.name !== undefined && !categoryData.name?.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome da categoria é obrigatório',
          variant: 'destructive',
        })
        return false
      }

      if (categoryData.type !== undefined && !validateCategoryType(categoryData.type)) {
        toast({
          title: 'Erro de validação',
          description: 'Tipo de categoria inválido (deve ser "expense" ou "revenue")',
          variant: 'destructive',
        })
        return false
      }

      // Normalizar dados
      const normalizedData = normalizeCategoryData(categoryData)

      console.log('🔄 [useCategories] Atualizando categoria:', { id, data: normalizedData })

      const { data, error: supabaseError } = await categories.update(id, normalizedData)
      
      if (supabaseError) {
        console.error('❌ [useCategories] Erro do Supabase:', supabaseError)
        throw new Error(supabaseError.message)
      }
      
      if (data) {
        console.log('✅ [useCategories] Categoria atualizada:', data)
        setCategoriesList(prev => 
          prev.map(cat => cat.id === id ? data : cat)
        )
        toast({
          title: 'Categoria atualizada com sucesso!',
          description: `A categoria "${data.name}" foi atualizada.`,
        })
        return true
      }
      
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
      console.error('❌ [useCategories] Erro ao atualizar categoria:', err)
      toast({
        title: 'Erro ao atualizar categoria',
        description: errorMessage,
        variant: 'destructive',
      })
      return false
    }
  }

  // Excluir categoria
  const deleteCategory = async (id: string, categoryName?: string) => {
    try {
      console.log('🔄 [useCategories] Excluindo categoria:', { id, name: categoryName })

      const { error: supabaseError } = await categories.delete(id)
      
      if (supabaseError) {
        console.error('❌ [useCategories] Erro do Supabase:', supabaseError)
        throw new Error(supabaseError.message)
      }
      
      console.log('✅ [useCategories] Categoria excluída com sucesso')
      setCategoriesList(prev => prev.filter(cat => cat.id !== id))
      toast({
        title: 'Categoria excluída',
        description: categoryName ? `A categoria "${categoryName}" foi excluída com sucesso.` : 'Categoria excluída com sucesso.',
        variant: 'destructive',
      })
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria'
      console.error('❌ [useCategories] Erro ao excluir categoria:', err)
      toast({
        title: 'Erro ao excluir categoria',
        description: errorMessage,
        variant: 'destructive',
      })
      return false
    }
  }

  // Buscar categorias
  const searchCategories = async (searchTerm: string) => {
    if (!organizationId) return

    try {
      setLoading(true)
      
      if (!searchTerm.trim()) {
        await loadCategories()
        return
      }
      
      const { data, error: supabaseError } = await categories.search(organizationId, searchTerm)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setCategoriesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categorias'
      setError(errorMessage)
      toast({
        title: 'Erro ao buscar categorias',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar categorias por tipo
  const expenseCategories = categoriesList.filter(cat => cat.type === 'expense')
  const revenueCategories = categoriesList.filter(cat => cat.type === 'revenue')

  // Carregar categorias quando a organização mudar
  useEffect(() => {
    loadCategories()
  }, [organizationId])

  return {
    categories: categoriesList,
    expenseCategories,
    revenueCategories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories,
    refreshCategories: loadCategories
  }
}