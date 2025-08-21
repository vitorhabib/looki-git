import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Função utilitária para normalizar dados do cliente
const normalizeClientData = (data: any) => {
  const normalized = { ...data };
  
  // Converter campos vazios para undefined (exceto campos obrigatórios)
  Object.keys(normalized).forEach(key => {
    if (key !== 'name' && key !== 'email' && key !== 'organization_id') {
      if (normalized[key] === '' || normalized[key] === null) {
        normalized[key] = undefined;
      }
    }
  });
  
  return normalized;
};

// Função utilitária para validar email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  status: 'active' | 'inactive' | 'defaulter';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}



export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useAuth();

  const loadClients = useCallback(async () => {
    console.log('🔄 [useClients] Carregando clientes...', { currentOrganization });
    
    if (!currentOrganization) {
      console.log('⚠️ [useClients] Nenhuma organização selecionada');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      setClients(data || []);
      console.log('✅ [useClients] Clientes carregados:', data?.length || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useClients] Erro ao carregar clientes:', err);
      setError(errorMessage);
      setClients([]);
      toast.error('Erro ao carregar clientes: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    try {
      setError(null);
      
      if (!currentOrganization) {
        toast.error('Nenhuma organização selecionada');
        return;
      }

      // Validações básicas
      if (!clientData.name?.trim()) {
        toast.error('Nome do cliente é obrigatório');
        return;
      }

      if (!clientData.email?.trim()) {
        toast.error('Email do cliente é obrigatório');
        return;
      }

      if (!validateEmail(clientData.email)) {
        toast.error('Email inválido');
        return;
      }

      // Normalizar dados
      const normalizedData = normalizeClientData({
        ...clientData,
        organization_id: currentOrganization.id
      });

      console.log('🔄 [useClients] Criando cliente:', normalizedData);

      const { data, error: supabaseError } = await supabase
        .from('clients')
        .insert([normalizedData])
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ [useClients] Erro do Supabase:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('✅ [useClients] Cliente criado:', data);
      setClients(prev => [data, ...prev]);
      toast.success('Cliente criado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useClients] Erro ao criar cliente:', err);
      setError(errorMessage);
      toast.error('Erro ao criar cliente: ' + errorMessage);
    }
  };

  const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>) => {
    try {
      setError(null);
      
      // Validações básicas se os campos estão sendo atualizados
      if (clientData.name !== undefined && !clientData.name?.trim()) {
        toast.error('Nome do cliente é obrigatório');
        return;
      }

      if (clientData.email !== undefined) {
        if (!clientData.email?.trim()) {
          toast.error('Email do cliente é obrigatório');
          return;
        }
        if (!validateEmail(clientData.email)) {
          toast.error('Email inválido');
          return;
        }
      }

      // Normalizar dados
      const normalizedData = normalizeClientData({
        ...clientData,
        updated_at: new Date().toISOString()
      });

      console.log('🔄 [useClients] Atualizando cliente:', { id, data: normalizedData });

      const { data, error: supabaseError } = await supabase
        .from('clients')
        .update(normalizedData)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ [useClients] Erro do Supabase:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('✅ [useClients] Cliente atualizado:', data);
      setClients(prev => prev.map(client => client.id === id ? data : client));
      toast.success('Cliente atualizado com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useClients] Erro ao atualizar cliente:', err);
      setError(errorMessage);
      toast.error('Erro ao atualizar cliente: ' + errorMessage);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);
      
      console.log('🔄 [useClients] Excluindo cliente:', id);

      const { error: supabaseError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        console.error('❌ [useClients] Erro do Supabase:', supabaseError);
        throw new Error(supabaseError.message);
      }
      
      console.log('✅ [useClients] Cliente excluído com sucesso');
      setClients(prev => prev.filter(client => client.id !== id));
      toast.success('Cliente excluído com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useClients] Erro ao excluir cliente:', err);
      setError(errorMessage);
      toast.error('Erro ao excluir cliente: ' + errorMessage);
    }
  };

  const refreshClients = async () => {
    await loadClients();
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refreshClients,
  };
}