import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RecurringService {
  id: string;
  client_id: string;
  organization_id: string;
  invoice_number: string;
  name: string;
  description?: string;
  amount: number; // valor em centavos (total_amount)
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string; // issue_date
  end_date?: string;
  status: 'active' | 'paused' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue';
  next_billing_date?: string; // due_date
  created_at: string;
  updated_at: string;
}

export interface OneTimeService {
  id: string;
  client_id: string;
  organization_id: string;
  invoice_number: string;
  name: string;
  description?: string;
  amount: number; // valor em centavos (total_amount)
  execution_date: string; // issue_date
  payment_date?: string; // paid_at
  status: 'pending' | 'completed' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const [recurringServices, setRecurringServices] = useState<RecurringService[]>([]);
  const [oneTimeServices, setOneTimeServices] = useState<OneTimeService[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useAuth();
  const { toast } = useToast();

  // Carregar serviços recorrentes
  const loadRecurringServices = async (clientId?: string) => {
    if (!currentOrganization) return;

    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_recurring', true)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapear dados da invoice para RecurringService
      const mappedData = data?.map(invoice => {
        // Garantir que frequency seja um valor válido
        const validFrequencies: ('weekly' | 'monthly' | 'quarterly' | 'yearly')[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
        const frequency = validFrequencies.includes(invoice.recurring_frequency as any) 
          ? invoice.recurring_frequency as ('weekly' | 'monthly' | 'quarterly' | 'yearly')
          : 'monthly'; // valor padrão

        return {
          id: invoice.id,
          client_id: invoice.client_id,
          organization_id: invoice.organization_id,
          invoice_number: invoice.invoice_number,
          name: invoice.title || invoice.notes || `Serviço Recorrente #${invoice.invoice_number}`,
          description: invoice.payment_terms,
          amount: Math.round(invoice.total_amount * 100), // converter para centavos
          frequency,
          start_date: invoice.issue_date,
          end_date: null, // não disponível na tabela invoices
          status: invoice.status,
          next_billing_date: invoice.due_date,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at
        };
      }) || [];
      
      setRecurringServices(mappedData);
    } catch (error) {
      console.error('Erro ao carregar serviços recorrentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços recorrentes",
        variant: "destructive",
      });
    }
  };

  // Carregar serviços pontuais
  const loadOneTimeServices = async (clientId?: string) => {
    if (!currentOrganization) return;

    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_recurring', false)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapear dados da invoice para OneTimeService
      const mappedData = data?.map(invoice => {
        // Garantir que status seja um valor válido para OneTimeService
        const validStatuses: ('pending' | 'completed' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')[] = 
          ['pending', 'completed', 'cancelled', 'draft', 'sent', 'paid', 'overdue'];
        const status = validStatuses.includes(invoice.status as any) 
          ? invoice.status as ('pending' | 'completed' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')
          : 'pending'; // valor padrão

        return {
          id: invoice.id,
          client_id: invoice.client_id,
          organization_id: invoice.organization_id,
          invoice_number: invoice.invoice_number,
          name: invoice.title || invoice.notes || `Serviço Pontual #${invoice.invoice_number}`,
          description: invoice.payment_terms,
          amount: Math.round(invoice.total_amount * 100), // converter para centavos
          execution_date: invoice.issue_date,
          payment_date: invoice.paid_at,
          status,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at
        };
      }) || [];
      
      setOneTimeServices(mappedData);
    } catch (error) {
      console.error('Erro ao carregar serviços pontuais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços pontuais",
        variant: "destructive",
      });
    }
  };

  // Criar serviço recorrente
  const createRecurringService = async (serviceData: Omit<RecurringService, 'id' | 'created_at' | 'updated_at' | 'invoice_number'>) => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      
      // Gerar número da invoice
      const invoiceNumber = `REC-${Date.now()}`;
      
      const invoiceData = {
         invoice_number: invoiceNumber,
         client_id: serviceData.client_id,
         organization_id: serviceData.organization_id,
         issue_date: serviceData.start_date,
         due_date: serviceData.next_billing_date || serviceData.start_date,
         status: 'draft',
         subtotal: serviceData.amount / 100, // converter de centavos para reais
         tax_amount: 0,
         discount_amount: 0,
         total_amount: serviceData.amount / 100, // converter de centavos para reais
         title: serviceData.name,
         notes: serviceData.description,
         payment_terms: serviceData.description,
         is_recurring: true
       };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      // Mapear de volta para RecurringService
      const validStatuses: ('active' | 'paused' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')[] = 
        ['active', 'paused', 'cancelled', 'draft', 'sent', 'paid', 'overdue'];
      const status = validStatuses.includes(data.status as any) 
        ? data.status as ('active' | 'paused' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')
        : 'draft'; // valor padrão

       const mappedService: RecurringService = {
         id: data.id,
         client_id: data.client_id,
         organization_id: data.organization_id,
         invoice_number: data.invoice_number,
         name: data.title || data.notes || `Serviço Recorrente #${data.invoice_number}`,
         description: data.payment_terms,
         amount: Math.round(data.total_amount * 100),
         frequency: serviceData.frequency,
         start_date: data.issue_date,
         end_date: serviceData.end_date,
         status,
         next_billing_date: data.due_date,
         created_at: data.created_at,
         updated_at: data.updated_at
       };

      setRecurringServices(prev => [mappedService, ...prev]);
      toast({
        title: "Sucesso",
        description: "Serviço recorrente criado com sucesso.",
      });
      return mappedService;
    } catch (error) {
      console.error('Erro ao criar serviço recorrente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o serviço recorrente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Criar serviço pontual
  const createOneTimeService = async (serviceData: Omit<OneTimeService, 'id' | 'created_at' | 'updated_at' | 'invoice_number'>) => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      
      // Gerar número da invoice
      const invoiceNumber = `SRV-${Date.now()}`;
      
      const invoiceData = {
         invoice_number: invoiceNumber,
         client_id: serviceData.client_id,
         organization_id: serviceData.organization_id,
         issue_date: serviceData.execution_date,
         due_date: serviceData.execution_date,
         status: 'draft',
         subtotal: serviceData.amount / 100, // converter de centavos para reais
         tax_amount: 0,
         discount_amount: 0,
         total_amount: serviceData.amount / 100, // converter de centavos para reais
         title: serviceData.name,
         notes: serviceData.description,
         payment_terms: serviceData.description,
         paid_at: serviceData.payment_date,
         is_recurring: false
       };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      // Mapear de volta para OneTimeService
      const validOneTimeStatuses: ('pending' | 'completed' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')[] = 
        ['pending', 'completed', 'cancelled', 'draft', 'sent', 'paid', 'overdue'];
      const oneTimeStatus = validOneTimeStatuses.includes(data.status as any) 
        ? data.status as ('pending' | 'completed' | 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue')
        : 'pending'; // valor padrão

       const mappedService: OneTimeService = {
         id: data.id,
         client_id: data.client_id,
         organization_id: data.organization_id,
         invoice_number: data.invoice_number,
         name: data.title || data.notes || `Serviço Pontual #${data.invoice_number}`,
         description: data.payment_terms,
         amount: Math.round(data.total_amount * 100),
         execution_date: data.issue_date,
         payment_date: data.paid_at,
         status: oneTimeStatus,
         created_at: data.created_at,
         updated_at: data.updated_at
       };

      setOneTimeServices(prev => [mappedService, ...prev]);
      toast({
        title: "Sucesso",
        description: "Serviço pontual criado com sucesso.",
      });
      return mappedService;
    } catch (error) {
      console.error('Erro ao criar serviço pontual:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o serviço pontual.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar serviço recorrente
  const updateRecurringService = async (id: string, updates: Partial<RecurringService>) => {
    try {
      const { data, error } = await supabase
        .from('recurring_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRecurringServices(prev => 
        prev.map(service => service.id === id ? data : service)
      );

      toast({
        title: "Sucesso",
        description: "Serviço recorrente atualizado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar serviço recorrente:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço recorrente",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar serviço pontual
  const updateOneTimeService = async (id: string, updates: Partial<OneTimeService>) => {
    try {
      const { data, error } = await supabase
        .from('one_time_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOneTimeServices(prev => 
        prev.map(service => service.id === id ? data : service)
      );

      toast({
        title: "Sucesso",
        description: "Serviço pontual atualizado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar serviço pontual:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço pontual",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar serviço recorrente
  const deleteRecurringService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: "Sucesso",
        description: "Serviço recorrente removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao deletar serviço recorrente:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover serviço recorrente",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar serviço pontual
  const deleteOneTimeService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('one_time_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOneTimeServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: "Sucesso",
        description: "Serviço pontual removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao deletar serviço pontual:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover serviço pontual",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      setLoading(true);
      Promise.all([
        loadRecurringServices(),
        loadOneTimeServices()
      ]).finally(() => setLoading(false));
    }
  }, [currentOrganization]);

  return {
    recurringServices,
    oneTimeServices,
    loading,
    loadRecurringServices,
    loadOneTimeServices,
    createRecurringService,
    createOneTimeService,
    updateRecurringService,
    updateOneTimeService,
    deleteRecurringService,
    deleteOneTimeService,
  };
}