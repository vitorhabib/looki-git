import { useState, useEffect, useCallback } from 'react';
import { supabase, categories } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from './useClients';



export interface Invoice {
  id: string;
  invoice_number: string;
  title?: string;
  client_id: string;
  category_id?: string;
  organization_id: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  payment_terms?: string;
  payment_method?: string;
  paid_at?: string;
  is_recurring?: boolean;
  recurring_frequency?: 'monthly' | 'quarterly' | 'yearly';
  recurring_start_date?: string;
  recurring_end_date?: string;
  parent_invoice_id?: string;
  next_recurring_date?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  category?: { id: string; name: string; color: string; type: string };

}

export interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'invoice_number'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  markAsPaid: (id: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
}



export function useInvoices(): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useAuth();

  // Utility functions
  const isNetworkError = (error: any): boolean => {
    return error?.message?.includes('Failed to fetch') || 
           error?.message?.includes('NetworkError') ||
           error?.code === 'NETWORK_ERROR' ||
           !navigator.onLine;
  };

  const normalizeInvoiceData = (data: any) => {
    return {
      ...data,
      total_amount: data.total_amount ? parseFloat(data.total_amount.toString()) : 0,
      discount_amount: data.discount_amount ? parseFloat(data.discount_amount.toString()) : 0,
      category_id: data.category_id === '' || data.category_id === undefined ? null : data.category_id,
      client_id: data.client_id === '' || data.client_id === undefined ? null : data.client_id,
      title: data.title === null || data.title === undefined ? '' : data.title,
      issue_date: data.issue_date || new Date().toISOString().split('T')[0],
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      // Padronizar campos opcionais
      notes: data.notes === null || data.notes === undefined ? undefined : data.notes,
      recurring_frequency: data.recurring_frequency === '' || data.recurring_frequency === null ? undefined : data.recurring_frequency,
      recurring_start_date: data.recurring_start_date === '' || data.recurring_start_date === null ? undefined : data.recurring_start_date,
      recurring_end_date: data.recurring_end_date === '' || data.recurring_end_date === null ? undefined : data.recurring_end_date
    };
  };

  const validateAmount = (amount: any): number => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Valor deve ser um número válido e maior que zero');
    }
    
    return numAmount;
  };

  const validateCategory = async (categoryId: string | null, organizationId: string): Promise<void> => {
    if (!categoryId) return; // Category is optional
    
    try {
      const { data: categoryList, error } = await categories.getByOrganization(organizationId);
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        throw new Error('Erro ao validar categoria');
      }
      
      if (!categoryList) {
        throw new Error('Nenhuma categoria encontrada');
      }
      
      const validCategory = categoryList.find(cat => cat.id === categoryId);
      
      if (!validCategory) {
        throw new Error('Categoria selecionada não pertence à organização atual');
      }
    } catch (error) {
      console.error('Erro ao validar categoria:', error);
      throw new Error('Erro ao validar categoria');
    }
  };

  // Função para gerar número de fatura único
  const generateInvoiceNumber = async (): Promise<string> => {
    if (!currentOrganization) {
      throw new Error('Organização não encontrada');
    }

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoiceNumber = `FAT-${year}${month}${day}-${random}`;

      // Verificar se o número já existe
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('invoice_number', invoiceNumber)
        .single();

      if (!existing) {
        console.log('📋 Número de fatura gerado:', invoiceNumber);
        return invoiceNumber;
      }

      attempts++;
      console.log(`⚠️ Número de fatura ${invoiceNumber} já existe, tentativa ${attempts}/${maxAttempts}`);
    }

    throw new Error('Não foi possível gerar um número de fatura único');
  };

  const loadInvoices = useCallback(async () => {
    console.log('🔄 Carregando faturas...');
    console.log('🏢 Organização atual:', currentOrganization);
    
    if (!currentOrganization) {
      console.log('❌ Nenhuma organização selecionada');
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Buscando faturas para organização:', currentOrganization.id);
      
      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          category:categories(*)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      console.log('📊 Resultado da busca:', { data, error: supabaseError });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      console.log('✅ Faturas carregadas:', data?.length || 0);
      setInvoices(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setInvoices([]);
      toast.error('Erro ao carregar faturas: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'invoice_number'>) => {
    try {
      setError(null);
      
      if (!currentOrganization) {
        toast.error('Nenhuma organização selecionada');
        return;
      }

      // Verificar sessão do usuário
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Sessão do usuário:', { session: session?.user?.id, error: sessionError });
      
      if (!session?.user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Você precisa estar logado para criar faturas');
        return;
      }

      // Normalize data
      const normalizedData = normalizeInvoiceData(invoiceData);
      console.log('Normalized invoice data:', normalizedData);

      // Validate amount
      const validAmount = validateAmount(normalizedData.total_amount);
      normalizedData.total_amount = validAmount;

      // Validate category if provided
      if (normalizedData.category_id) {
        await validateCategory(normalizedData.category_id, currentOrganization.id);
      }

      // Validar consistência categoria-organização
      if (normalizedData.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('organization_id')
          .eq('id', normalizedData.category_id)
          .single();

        if (categoryError || !categoryData) {
          console.error('❌ Erro ao verificar categoria:', categoryError);
          toast.error('Categoria não encontrada');
          return;
        }

        if (categoryData.organization_id !== currentOrganization.id) {
          console.error('❌ Categoria não pertence à organização do usuário');
          toast.error('Categoria não pertence à sua organização');
          return;
        }
      }

      const invoiceNumber = await generateInvoiceNumber();
      const newInvoiceData = {
        ...normalizedData,
        organization_id: currentOrganization.id,
        invoice_number: invoiceNumber,
      };

      console.log('Dados que serão enviados para o Supabase:', newInvoiceData);
      console.log('Organização atual:', currentOrganization);
      console.log('👤 Usuário autenticado:', session.user.id);

      // Verificar se o usuário pertence à organização
      const { data: userOrg, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('organization_id', currentOrganization.id)
        .single();

      console.log('🏢 Verificação de organização:', { userOrg, error: userOrgError });

      if (!userOrg) {
        console.error('❌ Usuário não pertence à organização');
        toast.error('Você não tem permissão para criar faturas nesta organização');
        return;
      }

      // Verificar se o cliente existe e pertence à organização
      const { data: clientCheck, error: clientError } = await supabase
        .from('clients')
        .select('id, organization_id')
        .eq('id', normalizedData.client_id)
        .eq('organization_id', currentOrganization.id)
        .single();

      console.log('👥 Verificação de cliente:', { clientCheck, error: clientError });

      if (!clientCheck) {
        console.error('❌ Cliente não encontrado ou não pertence à organização');
        toast.error('Cliente inválido');
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .insert([newInvoiceData])
        .select(`
          *,
          client:clients(*)
        `)
        .single();

      console.log('Resposta do Supabase:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('Erro do Supabase:', supabaseError);
        console.error('❌ Detalhes do erro:', {
          code: supabaseError.code,
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint
        });
        throw new Error(supabaseError.message);
      }
      
      setInvoices(prev => [data, ...prev]);
      toast.success('Fatura criada com sucesso');
      console.log('Fatura criada e adicionada ao estado:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro completo ao criar fatura:', err);
      setError(errorMessage);
      toast.error('Erro ao criar fatura: ' + errorMessage);
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>) => {
    console.log('🔄 Iniciando atualização de fatura:', { id, invoiceData });
    
    try {
      setError(null);
      
      if (!currentOrganization) {
        console.error('❌ Organização não encontrada');
        toast.error('Organização não encontrada');
        return;
      }
      
      // Normalize data
      const normalizedData = normalizeInvoiceData(invoiceData);
      console.log('📝 Dados normalizados para atualização:', normalizedData);

      // Validate amount if provided
      if (normalizedData.total_amount !== undefined) {
        const validAmount = validateAmount(normalizedData.total_amount);
        normalizedData.total_amount = validAmount;
        console.log('✅ Valor validado:', validAmount);
      }

      // Validate category if provided
      if (normalizedData.category_id !== undefined && currentOrganization) {
        await validateCategory(normalizedData.category_id, currentOrganization.id);
        console.log('✅ Categoria validada:', normalizedData.category_id);
      }
      
      // Validar consistência categoria-organização
      if (normalizedData.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('organization_id')
          .eq('id', normalizedData.category_id)
          .single();

        if (categoryError || !categoryData) {
          console.error('❌ Erro ao verificar categoria:', categoryError);
          toast.error('Categoria não encontrada');
          return;
        }

        if (categoryData.organization_id !== currentOrganization.id) {
          console.error('❌ Categoria não pertence à organização do usuário');
          toast.error('Categoria não pertence à sua organização');
          return;
        }
      }
      
      console.log('📤 Enviando atualização para Supabase...');
      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .update({ ...normalizedData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select(`
          *,
          client:clients(*)
        `)
        .single();

      console.log('📊 Resposta do Supabase (atualização):', { data, error: supabaseError });

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao atualizar fatura:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('📊 Estado das faturas antes da atualização:', invoices.length);
      setInvoices(prev => {
        const updated = prev.map(invoice => invoice.id === id ? data : invoice);
        console.log('📊 Estado das faturas após atualização:', updated.length);
        return updated;
      });
      
      console.log('✅ Fatura atualizada com sucesso!');
      toast.success('Fatura atualizada com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro completo ao atualizar fatura:', err);
      setError(errorMessage);
      toast.error('Erro ao atualizar fatura: ' + errorMessage);
    }
  };

  const deleteInvoice = async (id: string) => {
    console.log('🗑️ Iniciando exclusão de fatura:', { id });
    
    try {
      setError(null);
      
      if (!currentOrganization) {
        console.error('❌ Organização não encontrada');
        toast.error('Organização não encontrada');
        return;
      }
      
      console.log('📤 Enviando exclusão para Supabase...');
      const { error: supabaseError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);

      console.log('📊 Resposta do Supabase (exclusão):', { error: supabaseError });

      if (supabaseError) {
        console.error('❌ Erro do Supabase ao excluir fatura:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('📊 Estado das faturas antes da exclusão:', invoices.length);
      setInvoices(prev => {
        const filtered = prev.filter(invoice => invoice.id !== id);
        console.log('📊 Estado das faturas após exclusão:', filtered.length);
        return filtered;
      });
      
      console.log('✅ Fatura excluída com sucesso!');
      toast.success('Fatura excluída com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro completo ao excluir fatura:', err);
      setError(errorMessage);
      toast.error('Erro ao excluir fatura: ' + errorMessage);
    }
  };







  const markAsPaid = async (id: string) => {
    await updateInvoice(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  };

  const refreshInvoices = async () => {
    await loadInvoices();
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,

    markAsPaid,
    refreshInvoices,
  };
}