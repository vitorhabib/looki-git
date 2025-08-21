import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Tag,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  MessageCircle,
  Send,
  Paperclip,
  Star,
  Archive
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  created_at: string;
  updated_at: string;
  organization_id?: string;
  organization_name?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  assigned_to?: string;
  assigned_to_name?: string;
  messages_count: number;
  last_message_at?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  message: string;
  created_at: string;
  user_id: string;
  user_name: string;
  is_internal: boolean;
  attachments?: string[];
}

interface SupportStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_response_time: number;
  satisfaction_rate: number;
}

const SupportSystem = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

  // Mock data - em produção, estes dados viriam do Supabase
  const mockStats: SupportStats = {
    total_tickets: 1247,
    open_tickets: 89,
    in_progress_tickets: 34,
    resolved_today: 12,
    avg_response_time: 2.4,
    satisfaction_rate: 94.2
  };

  const mockTickets: Ticket[] = [
    {
      id: '1',
      title: 'Erro ao gerar relatório financeiro',
      description: 'Não consigo gerar o relatório mensal, aparece erro 500',
      status: 'open',
      priority: 'high',
      category: 'technical',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      organization_id: 'org1',
      organization_name: 'TechCorp Solutions',
      user_id: 'user1',
      user_name: 'João Silva',
      user_email: 'joao@techcorp.com',
      messages_count: 3,
      last_message_at: '2024-01-15T14:20:00Z'
    },
    {
      id: '2',
      title: 'Solicitação de aumento de limite',
      description: 'Preciso aumentar o limite de usuários da organização',
      status: 'in_progress',
      priority: 'medium',
      category: 'billing',
      created_at: '2024-01-14T16:45:00Z',
      updated_at: '2024-01-15T09:15:00Z',
      organization_id: 'org2',
      organization_name: 'Digital Marketing Pro',
      user_id: 'user2',
      user_name: 'Maria Santos',
      user_email: 'maria@digitalmarketing.com',
      assigned_to: 'admin1',
      assigned_to_name: 'Carlos Admin',
      messages_count: 5,
      last_message_at: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      title: 'Sugestão: Dashboard personalizado',
      description: 'Seria interessante ter dashboards personalizáveis',
      status: 'open',
      priority: 'low',
      category: 'feature_request',
      created_at: '2024-01-13T11:20:00Z',
      updated_at: '2024-01-13T11:20:00Z',
      organization_id: 'org3',
      organization_name: 'StartupHub',
      user_id: 'user3',
      user_name: 'Pedro Costa',
      user_email: 'pedro@startuphub.com',
      messages_count: 1,
      last_message_at: '2024-01-13T11:20:00Z'
    },
    {
      id: '4',
      title: 'Bug: Duplicação de faturas',
      description: 'Algumas faturas estão sendo duplicadas no sistema',
      status: 'resolved',
      priority: 'urgent',
      category: 'bug_report',
      created_at: '2024-01-12T08:30:00Z',
      updated_at: '2024-01-15T13:45:00Z',
      organization_id: 'org4',
      organization_name: 'Creative Agency',
      user_id: 'user4',
      user_name: 'Ana Oliveira',
      user_email: 'ana@creative.com',
      assigned_to: 'admin2',
      assigned_to_name: 'Lucas Admin',
      messages_count: 8,
      last_message_at: '2024-01-15T13:45:00Z'
    }
  ];

  const mockMessages: TicketMessage[] = [
    {
      id: '1',
      ticket_id: '1',
      message: 'Olá! Estou com problema para gerar o relatório financeiro mensal. Quando clico no botão, aparece um erro 500.',
      created_at: '2024-01-15T10:30:00Z',
      user_id: 'user1',
      user_name: 'João Silva',
      is_internal: false
    },
    {
      id: '2',
      ticket_id: '1',
      message: 'Olá João! Obrigado por reportar o problema. Vou investigar o erro 500 no sistema de relatórios. Você pode me informar qual período estava tentando gerar?',
      created_at: '2024-01-15T11:15:00Z',
      user_id: 'admin1',
      user_name: 'Suporte Técnico',
      is_internal: false
    },
    {
      id: '3',
      ticket_id: '1',
      message: 'Era o relatório de dezembro de 2023. Tentei várias vezes mas sempre dá o mesmo erro.',
      created_at: '2024-01-15T14:20:00Z',
      user_id: 'user1',
      user_name: 'João Silva',
      is_internal: false
    }
  ];

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTickets(mockTickets);
      setStats(mockStats);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de suporte.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      // Simular carregamento de mensagens
      const messages = mockMessages.filter(msg => msg.ticket_id === ticketId);
      setTicketMessages(messages);
    } catch (error) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Não foi possível carregar as mensagens do ticket.',
        variant: 'destructive'
      });
    }
  };

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
    setIsTicketDetailOpen(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const message: TicketMessage = {
        id: Date.now().toString(),
        ticket_id: selectedTicket.id,
        message: newMessage,
        created_at: new Date().toISOString(),
        user_id: 'admin_current',
        user_name: 'Master Admin',
        is_internal: false
      };

      setTicketMessages(prev => [...prev, message]);
      setNewMessage('');
      
      toast({
        title: 'Mensagem enviada',
        description: 'Sua resposta foi enviada com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive'
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() }
          : ticket
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      
      toast({
        title: 'Status atualizado',
        description: `Ticket marcado como ${newStatus}.`
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do ticket.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      urgent: 'destructive'
    };
    return variants[priority as keyof typeof variants] || 'outline';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <ArrowUp className="h-3 w-3" />;
      case 'high': return <ArrowUp className="h-3 w-3" />;
      case 'medium': return <Minus className="h-3 w-3" />;
      case 'low': return <ArrowDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Estatísticas de Suporte */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tickets || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os tempos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.open_tickets || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.in_progress_tickets || 0}</div>
            <p className="text-xs text-muted-foreground">Sendo processados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.resolved_today || 0}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_response_time || 0}h</div>
            <p className="text-xs text-muted-foreground">Tempo médio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.satisfaction_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Taxa de satisfação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
          <CardDescription>Gerencie todos os tickets de suporte da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleTicketClick(ticket)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{ticket.description}</p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {ticket.messages_count} mensagens
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.user_name}</p>
                      <p className="text-sm text-muted-foreground">{ticket.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {ticket.organization_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(ticket.status) as any}>
                      {ticket.status === 'open' && 'Aberto'}
                      {ticket.status === 'in_progress' && 'Em Andamento'}
                      {ticket.status === 'resolved' && 'Resolvido'}
                      {ticket.status === 'closed' && 'Fechado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadge(ticket.priority) as any} className="flex items-center w-fit">
                      {getPriorityIcon(ticket.priority)}
                      <span className="ml-1">
                        {ticket.priority === 'low' && 'Baixa'}
                        {ticket.priority === 'medium' && 'Média'}
                        {ticket.priority === 'high' && 'Alta'}
                        {ticket.priority === 'urgent' && 'Urgente'}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ticket.category === 'technical' && 'Técnico'}
                      {ticket.category === 'billing' && 'Cobrança'}
                      {ticket.category === 'feature_request' && 'Funcionalidade'}
                      {ticket.category === 'bug_report' && 'Bug'}
                      {ticket.category === 'general' && 'Geral'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(ticket.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTicketClick(ticket); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.id, 'in_progress'); }}>
                          <Clock className="mr-2 h-4 w-4" />
                          Marcar em Andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.id, 'resolved'); }}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Resolvido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateTicketStatus(ticket.id, 'closed'); }}>
                          <Archive className="mr-2 h-4 w-4" />
                          Fechar Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Ticket */}
      <Dialog open={isTicketDetailOpen} onOpenChange={setIsTicketDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTicket?.title}</span>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusBadge(selectedTicket?.status || '') as any}>
                  {selectedTicket?.status === 'open' && 'Aberto'}
                  {selectedTicket?.status === 'in_progress' && 'Em Andamento'}
                  {selectedTicket?.status === 'resolved' && 'Resolvido'}
                  {selectedTicket?.status === 'closed' && 'Fechado'}
                </Badge>
                <Badge variant={getPriorityBadge(selectedTicket?.priority || '') as any}>
                  {selectedTicket?.priority === 'low' && 'Baixa'}
                  {selectedTicket?.priority === 'medium' && 'Média'}
                  {selectedTicket?.priority === 'high' && 'Alta'}
                  {selectedTicket?.priority === 'urgent' && 'Urgente'}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p><strong>Usuário:</strong> {selectedTicket?.user_name}</p>
                  <p><strong>Email:</strong> {selectedTicket?.user_email}</p>
                </div>
                <div>
                  <p><strong>Organização:</strong> {selectedTicket?.organization_name || 'N/A'}</p>
                  <p><strong>Criado em:</strong> {selectedTicket ? formatDate(selectedTicket.created_at) : ''}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{selectedTicket?.description}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Conversação</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded p-3">
                {ticketMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.is_internal ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.user_name === 'Master Admin' || message.user_name.includes('Admin') || message.user_name.includes('Suporte')
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{message.user_name}</span>
                        <span className="text-xs opacity-70">{formatDate(message.created_at)}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="response">Sua Resposta</Label>
              <Textarea
                id="response"
                placeholder="Digite sua resposta..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Anexar Arquivo
                </Button>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Resposta
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportSystem;