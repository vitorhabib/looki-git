import { useState, useEffect, useCallback } from 'react'
import { expenses, categories, Expense, CreateExpenseData, UpdateExpenseData } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Utilitário simples para identificar erros de rede
const isNetworkError = (err: any): boolean => {
  if (!err) return false
  const msg = typeof err === 'string' ? err : (err.message || err.name || '')
  const text = String(msg).toLowerCase()
  return (
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('network error') ||
    text.includes('typeerror: failed to fetch') ||
    text.includes('the network connection was lost') ||
    // Alguns erros do supabase-js podem vir como { status: 0 }
    (typeof err.status === 'number' && err.status === 0)
  )
}

// Utilitário para normalizar dados de entrada
const normalizeExpenseData = (data: any): any => {
  const normalized = { ...data }
  
  // Normalizar category_id: string vazia -> null, manter string válida ou undefined
  if (normalized.category_id === '' || normalized.category_id === null) {
    normalized.category_id = null
  }
  
  // Normalizar outros campos vazios para undefined (exceto category_id que é null)
  Object.keys(normalized).forEach(key => {
    if (key !== 'category_id' && normalized[key] === '') {
      normalized[key] = undefined
    }
  })
  
  return normalized
}

// Utilitário para validar amount
const validateAmount = (amount: any): { isValid: boolean; value?: number; error?: string } => {
  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: 'O valor é obrigatório' }
  }
  
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  
  if (isNaN(numericValue)) {
    return { isValid: false, error: 'O valor deve ser um número válido' }
  }
  
  if (numericValue <= 0) {
    return { isValid: false, error: 'O valor deve ser maior que zero' }
  }
  
  return { isValid: true, value: numericValue }
}

// Chave do localStorage para fila offline
const OFFLINE_QUEUE_KEY = 'offlineExpenseQueue'

// Tipagem leve para itens da fila offline
type QueuedExpense = {
  tempId: string
  data: CreateExpenseData
  createdAt: string
}

interface UseExpensesReturn {
  expensesList: Expense[]
  loading: boolean
  error: string | null
  loadExpenses: () => Promise<void>
  createExpense: (expenseData: CreateExpenseData) => Promise<Expense | null>
  updateExpense: (id: string, expenseData: UpdateExpenseData) => Promise<Expense | null>
  deleteExpense: (id: string, expenseTitle?: string) => Promise<boolean>
  searchExpenses: (searchTerm: string) => Promise<void>
  filterByCategory: (categoryId: string) => Promise<void>
  filterByStatus: (status: 'pending' | 'paid' | 'overdue') => Promise<void>
  filterByDateRange: (startDate: string, endDate: string) => Promise<void>
  getExpenseStats: () => Promise<any>
  // Novos helpers para modo offline/debug
  offlineQueueCount: number
  syncOfflineExpenses: () => Promise<void>
}

export const useExpenses = (organizationId?: string): UseExpensesReturn => {
  const [expensesList, setExpensesList] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      const arr: QueuedExpense[] = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr.length : 0
    } catch {
      return 0
    }
  })
  const { toast } = useToast()

  // Helpers de fila offline
  const getQueue = (): QueuedExpense[] => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  const setQueue = (queue: QueuedExpense[]) => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    setOfflineQueueCount(queue.length)
  }

  const enqueue = (item: QueuedExpense) => {
    const q = getQueue()
    q.unshift(item)
    setQueue(q)
  }

  const dequeueByTempId = (tempId: string) => {
    const q = getQueue().filter(i => i.tempId !== tempId)
    setQueue(q)
  }

  // Tentar sincronizar fila offline com o backend
  const syncOfflineExpenses = useCallback(async () => {
    if (!organizationId) return

    const queue = getQueue()
    if (queue.length === 0) return

    console.log(`🔄 Sincronizando ${queue.length} despesa(s) offline...`)

    for (const item of queue) {
      try {
        // Garante org id
        const payload = { ...item.data, organization_id: organizationId }
        const { data, error: supabaseError } = await expenses.create(payload)
        if (supabaseError) {
          console.warn('⚠️ Falha ao sincronizar despesa offline:', supabaseError)
          if (isNetworkError(supabaseError)) {
            // manter na fila
            continue
          } else {
            // Erro não relacionado à rede, descartar item para evitar loop e avisar
            dequeueByTempId(item.tempId)
            toast({
              title: 'Erro ao sincronizar despesa offline',
              description: supabaseError.message,
              variant: 'destructive',
            })
            continue
          }
        }

        if (data) {
          // Substituir item local pelo do servidor
          setExpensesList(prev => {
            const idx = prev.findIndex(e => e.id === item.tempId)
            if (idx === -1) return prev
            const next = [...prev]
            next[idx] = data
            return next
          })
          dequeueByTempId(item.tempId)
          toast({ title: 'Despesa sincronizada', description: `"${data.title}" foi salva no servidor.` })
        }
      } catch (e) {
        console.warn('⚠️ Exceção ao sincronizar item offline:', e)
        if (!isNetworkError(e)) {
          // erro não rede -> descartar item
          dequeueByTempId(item.tempId)
        }
      }
    }
  }, [organizationId])

  // Carregar todas as despesas
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!organizationId) {
        console.log('🔄 Nenhuma organização selecionada, limpando lista de despesas')
        setExpensesList([])
        return
      }
      
      console.log('🔄 Carregando despesas para organização:', organizationId)
      const { data, error: supabaseError } = await expenses.getByOrganization(organizationId)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      console.log('✅ Despesas carregadas:', data?.length || 0)
      setExpensesList(data || [])

      // Após carregar, tentar sincronizar itens offline (se houver)
      await syncOfflineExpenses()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar despesas'
      console.error('❌ Erro ao carregar despesas:', err)
      setError(errorMessage)
      setExpensesList([])
    } finally {
      setLoading(false)
    }
  }, [organizationId, syncOfflineExpenses])

  // Criar nova despesa
  const createExpense = async (expenseData: CreateExpenseData): Promise<Expense | null> => {
    try {
      setLoading(true)
      setError(null)
      
      // Validar se há organização selecionada
      if (!organizationId) {
        console.error('❌ Nenhuma organização selecionada para criar despesa')
        toast({
          title: 'Erro',
          description: 'Nenhuma organização selecionada',
          variant: 'destructive',
        })
        return null
      }
      
      // Saneamento e validação de dados mínimos
      let processedData: CreateExpenseData = { ...expenseData, organization_id: organizationId }
      processedData = normalizeExpenseData(processedData)

      if (!processedData.title || !String(processedData.title).trim()) {
        toast({ title: 'Erro de validação', description: 'O título é obrigatório.', variant: 'destructive' })
        return null
      }

      const amountValidation = validateAmount((processedData as any).amount)
      if (!amountValidation.isValid) {
        toast({ title: 'Erro de validação', description: amountValidation.error!, variant: 'destructive' })
        return null
      }
      processedData.amount = amountValidation.value!

      if (!processedData.expense_date) {
        toast({ title: 'Erro de validação', description: 'A data da despesa é obrigatória.', variant: 'destructive' })
        return null
      }
      if (!processedData.payment_method) {
        toast({ title: 'Erro de validação', description: 'O método de pagamento é obrigatório.', variant: 'destructive' })
        return null
      }

      // Validar se a categoria pertence à organização (quando informada)
      if (processedData.category_id) {
        try {
          const { data: orgCats, error: catError } = await categories.getByOrganization(organizationId)
          if (catError) {
            console.warn('⚠️ Erro ao validar categoria (seguindo sem bloquear):', catError)
          } else {
            const exists = (orgCats || []).some(c => c.id === processedData.category_id)
            if (!exists) {
              toast({
                title: 'Categoria inválida',
                description: 'A categoria selecionada não pertence à organização atual.',
                variant: 'destructive',
              })
              return null
            }
          }
        } catch (e) {
          console.warn('⚠️ Exceção ao validar categoria (seguindo):', e)
        }
      }
      
      console.groupCollapsed('💰 useExpenses.createExpense - payload')
      console.log('organizationId:', organizationId)
      console.log('expenseData (input):', expenseData)
      
      // TODO: Reativar quando a coluna is_recurring for adicionada ao banco
      // Se for despesa recorrente, configurar next_recurring_date
      // if (processedData.is_recurring && processedData.recurring_start_date) {
      //   const startDate = new Date(processedData.recurring_start_date)
      //   const frequency = processedData.recurring_frequency || 'monthly'
      //   
      //   let nextDate = new Date(startDate)
      //   switch (frequency) {
      //     case 'monthly':
      //       nextDate.setMonth(nextDate.getMonth() + 1)
      //       break
      //     case 'quarterly':
      //       nextDate.setMonth(nextDate.getMonth() + 3)
      //       break
      //     case 'yearly':
      //       nextDate.setFullYear(nextDate.getFullYear() + 1)
      //       break
      //   }
      //   processedData.next_recurring_date = nextDate.toISOString().split('T')[0]
      // }
      console.log('processedData (final):', processedData)
      console.groupEnd()
      
      // Tentar criar no Supabase primeiro
      console.log('🚀 Enviando dados para Supabase (expenses.create)')
      const { data, error: supabaseError } = await expenses.create(processedData)
      console.debug('📡 Resposta do Supabase', { data, supabaseError })
      
      if (supabaseError) {
        // Diferenciar erro de rede de erro do PostgREST/RLS/validação
        const errMsg = supabaseError?.message || 'Erro desconhecido no Supabase'
        const details = (supabaseError as any)?.details
        const code = (supabaseError as any)?.code
        const status = (supabaseError as any)?.status
        console.error('❌ Erro do Supabase ao criar despesa:', { code, status, errMsg, details, supabaseError })

        if (isNetworkError(supabaseError)) {
          console.warn('🌐 Erro de rede detectado, aplicando fallback offline')
        } else {
          const message = [errMsg, details].filter(Boolean).join(' - ')
          setError(message)
          toast({
            title: 'Erro ao criar despesa',
            description: message,
            variant: 'destructive',
          })
          return null
        }
      }
      
      if (data) {
        console.log('✅ Despesa criada no Supabase, adicionando ao estado local:', data)
        setExpensesList(prev => {
          console.log('📝 Estado anterior:', prev.length, 'despesas')
          const newList = [data, ...prev]
          console.log('📝 Novo estado:', newList.length, 'despesas')
          return newList
        })
        toast({
          title: 'Despesa criada com sucesso!',
          description: `A despesa "${data.title}" foi adicionada.`,
        })
        return data
      }
      
      // Se chegamos aqui e não temos data, pode ser erro de conectividade -> fallback offline
      console.warn('⚠️ Nenhum dado retornado pela API, verificando fallback offline...')

      const tempId = `local-${Date.now()}`
      const newExpense: Expense = {
        id: tempId,
        ...processedData,
        category_id: (processedData as any).category_id ?? null,
        status: processedData.status || 'pending',
        receipt_url: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Atualiza lista local e enfileira para sync posterior
      setExpensesList(prev => [newExpense, ...prev])
      enqueue({ tempId, data: processedData, createdAt: new Date().toISOString() })
      toast({
        title: 'Despesa criada (modo offline)',
        description: `A despesa "${newExpense.title}" foi adicionada localmente e será sincronizada depois.`,
      })
      return newExpense
    } catch (err: any) {
      // Em caso de erro, somente criar localmente se for erro de rede
      console.warn('⚠️ Exceção ao criar despesa:', err)
      if (!isNetworkError(err)) {
        const message = err?.message || 'Erro ao criar despesa'
        setError(message)
        toast({
          title: 'Erro ao criar despesa',
          description: message,
          variant: 'destructive',
        })
        return null
      }

      console.warn('🌐 Erro de rede detectado, criando localmente...')
      const tempId = `local-${Date.now()}`
      const processedData: CreateExpenseData = normalizeExpenseData({ ...expenseData, organization_id: organizationId! })
      const newExpense: Expense = {
        id: tempId,
        ...processedData,
        category_id: (processedData as any).category_id ?? null,
        status: processedData.status || 'pending',
        receipt_url: null,
        tags: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setExpensesList(prev => [newExpense, ...prev])
      enqueue({ tempId, data: processedData, createdAt: new Date().toISOString() })
      toast({
        title: 'Despesa criada (modo offline)',
        description: `A despesa "${newExpense.title}" foi adicionada localmente e será sincronizada depois.`,
      })
      return newExpense
    } finally {
      setLoading(false)
    }
  }

  // Atualizar despesa
  const updateExpense = async (id: string, expenseData: UpdateExpenseData): Promise<Expense | null> => {
    try {
      setLoading(true)
      console.log('🔄 [UPDATE] Iniciando atualização da despesa:', { id, data: expenseData })

      // Normalizar entrada
      const processed: UpdateExpenseData = normalizeExpenseData(expenseData)
      console.log('🔄 [UPDATE] Dados normalizados:', processed)
      
      if (processed.amount !== undefined) {
        const amountValidation = validateAmount(processed.amount)
        if (!amountValidation.isValid) {
          console.error('❌ [UPDATE] Erro de validação do valor:', amountValidation.error)
          toast({ title: 'Erro de validação', description: amountValidation.error!, variant: 'destructive' })
          return null
        }
        processed.amount = amountValidation.value!
        console.log('✅ [UPDATE] Valor validado:', processed.amount)
      }

      // Validar categoria se informada
      if ((processed as any).category_id) {
        try {
          const { data: orgCats } = await categories.getByOrganization(organizationId!)
          const exists = (orgCats || []).some(c => c.id === (processed as any).category_id)
          if (!exists) {
            console.error('❌ [UPDATE] Categoria inválida:', (processed as any).category_id)
            toast({ title: 'Categoria inválida', description: 'A categoria selecionada não pertence à organização atual.', variant: 'destructive' })
            return null
          }
          console.log('✅ [UPDATE] Categoria validada:', (processed as any).category_id)
        } catch (e) {
          console.warn('⚠️ [UPDATE] Erro ao validar categoria (seguindo):', e)
        }
      }
      
      console.log('🚀 [UPDATE] Enviando dados para Supabase:', processed)
      const { data, error: supabaseError } = await expenses.update(id, processed)
      console.debug('📡 [UPDATE] Resposta do Supabase:', { data, supabaseError })
      
      if (supabaseError) {
        console.error('❌ [UPDATE] Erro do Supabase:', supabaseError)
        if (isNetworkError(supabaseError)) {
          console.log('🌐 [UPDATE] Erro de rede detectado - operação não suportada offline para atualização')
        }
        throw new Error(supabaseError.message)
      }
      
      if (data) {
        console.log('✅ [UPDATE] Despesa atualizada com sucesso:', data)
        setExpensesList(prev => prev.map(expense => 
          expense.id === id ? data : expense
        ))
        toast({
          title: 'Despesa atualizada com sucesso!',
          description: `A despesa "${data.title}" foi modificada.`,
        })
        return data
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar despesa'
      console.error('❌ [UPDATE] Erro ao atualizar despesa:', err)
      
      if (isNetworkError(err)) {
        console.log('🌐 [UPDATE] Erro de rede detectado - atualizações não são suportadas offline')
      }
      
      setError(errorMessage)
      toast({
        title: 'Erro ao atualizar despesa',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  // Excluir despesa
  const deleteExpense = async (id: string, expenseTitle?: string): Promise<boolean> => {
    try {
      setLoading(true)
      console.log('🗑️ [DELETE] Iniciando exclusão da despesa:', { id, title: expenseTitle })
      
      // Se for um item offline, removê-lo da fila
      if (id.startsWith('local-')) {
        console.log('📱 [DELETE] ID temporário detectado - removendo da fila offline')
        const queue = getQueue()
        const itemToRemove = queue.find(item => item.tempId === id)
        dequeueByTempId(id)
        console.log('✅ [DELETE] Item removido da fila offline:', itemToRemove)
        console.log('📊 [DELETE] Fila offline atualizada, itens restantes:', getQueue().length)
        
        setExpensesList(prev => prev.filter(expense => expense.id !== id))
        toast({
          title: 'Despesa removida da fila offline!',
          description: expenseTitle ? `A despesa "${expenseTitle}" foi removida da fila.` : 'A despesa foi removida da fila.',
        })
        return true
      }
      
      console.log('🚀 [DELETE] Enviando solicitação de exclusão para Supabase')
      const { error: supabaseError } = await expenses.delete(id)
      console.debug('📡 [DELETE] Resposta do Supabase:', { supabaseError })
      
      if (supabaseError) {
        console.error('❌ [DELETE] Erro do Supabase:', supabaseError)
        if (isNetworkError(supabaseError)) {
          console.log('🌐 [DELETE] Erro de rede detectado - operação não suportada offline para exclusão')
        }
        throw new Error(supabaseError.message)
      }
      
      console.log('✅ [DELETE] Despesa excluída com sucesso')
      setExpensesList(prev => prev.filter(expense => expense.id !== id))

      toast({
        title: 'Despesa excluída com sucesso!',
        description: expenseTitle ? `A despesa "${expenseTitle}" foi removida.` : 'A despesa foi removida.',
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir despesa'
      console.error('❌ [DELETE] Erro ao excluir despesa:', err)
      
      if (isNetworkError(err)) {
        console.log('🌐 [DELETE] Erro de rede detectado - exclusões não são suportadas offline')
      }
      
      setError(errorMessage)
      toast({
        title: 'Erro ao excluir despesa',
        description: errorMessage,
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Buscar despesas
  const searchExpenses = async (searchTerm: string) => {
    if (!organizationId) return

    try {
      setLoading(true)
      
      if (!searchTerm.trim()) {
        await loadExpenses()
        return
      }
      
      const { data, error: supabaseError } = await expenses.search(organizationId, searchTerm)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setExpensesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar despesas'
      setError(errorMessage)
      toast({
        title: 'Erro ao buscar despesas',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar por categoria
  const filterByCategory = async (categoryId: string) => {
    if (!organizationId) return

    try {
      setLoading(true)
      
      const { data, error: supabaseError } = await expenses.getByCategory(organizationId, categoryId)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setExpensesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao filtrar despesas por categoria'
      setError(errorMessage)
      toast({
        title: 'Erro ao filtrar despesas',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar por status
  const filterByStatus = async (status: 'pending' | 'paid' | 'overdue') => {
    if (!organizationId) return

    try {
      setLoading(true)
      
      const { data, error: supabaseError } = await expenses.getByStatus(organizationId, status)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setExpensesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao filtrar despesas por status'
      setError(errorMessage)
      toast({
        title: 'Erro ao filtrar despesas',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar por período
  const filterByDateRange = async (startDate: string, endDate: string) => {
    if (!organizationId) return

    try {
      setLoading(true)
      
      const { data, error: supabaseError } = await expenses.getByDateRange(organizationId, startDate, endDate)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      setExpensesList(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao filtrar despesas por período'
      setError(errorMessage)
      toast({
        title: 'Erro ao filtrar despesas',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Obter estatísticas
  const getExpenseStats = async () => {
    if (!organizationId) return null

    try {
      const { data, error: supabaseError } = await expenses.getStats(organizationId)
      
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter estatísticas'
      setError(errorMessage)
      toast({
        title: 'Erro ao obter estatísticas',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }

  // Carregar despesas quando o organizationId mudar ou na inicialização
  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  // Quando a conexão voltar, tentar sincronizar fila offline
  useEffect(() => {
    const onOnline = () => {
      syncOfflineExpenses()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [syncOfflineExpenses])

  return {
    expensesList,
    loading,
    error,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    searchExpenses,
    filterByCategory,
    filterByStatus,
    filterByDateRange,
    getExpenseStats,
    offlineQueueCount,
    syncOfflineExpenses,
  }
}

export default useExpenses