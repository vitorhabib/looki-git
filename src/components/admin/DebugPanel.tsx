import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, CheckCircle, XCircle, Database, Code, Bug, Zap } from 'lucide-react';

interface DebugResult {
  query: string;
  result: any;
  error?: string;
  timestamp: Date;
  duration?: number;
}

interface SystemCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export function DebugPanel() {
  const [sqlQuery, setSqlQuery] = useState('');
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) return;

    setIsRunning(true);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query: sqlQuery
      });

      const duration = Date.now() - startTime;
      const result: DebugResult = {
        query: sqlQuery,
        result: data,
        error: error?.message,
        timestamp: new Date(),
        duration
      };

      setDebugResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const result: DebugResult = {
        query: sqlQuery,
        result: null,
        error: err.message,
        timestamp: new Date(),
        duration
      };

      setDebugResults(prev => [result, ...prev.slice(0, 9)]);
    } finally {
      setIsRunning(false);
    }
  };

  const runSystemChecks = async () => {
    setIsRunning(true);
    const checks: SystemCheck[] = [];

    try {
      // 1. Verificar estrutura da tabela invoices
      const { data: invoiceColumns, error: invoiceError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'invoices' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

      if (invoiceError) {
        checks.push({
          name: 'Estrutura da Tabela Invoices',
          status: 'error',
          message: 'Erro ao verificar estrutura da tabela invoices',
          details: invoiceError
        });
      } else {
        const hasClientName = invoiceColumns?.some((col: any) => col.column_name === 'client_name');
        const hasClientId = invoiceColumns?.some((col: any) => col.column_name === 'client_id');
        
        checks.push({
          name: 'Estrutura da Tabela Invoices',
          status: hasClientId ? 'success' : 'warning',
          message: hasClientId 
            ? 'Tabela invoices possui client_id (correto)' 
            : 'Tabela invoices não possui client_id',
          details: {
            has_client_name: hasClientName,
            has_client_id: hasClientId,
            columns: invoiceColumns
          }
        });
      }

      // 2. Verificar foreign keys
      const { data: foreignKeys, error: fkError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'invoices'
          ORDER BY tc.constraint_name;
        `
      });

      if (fkError) {
        checks.push({
          name: 'Foreign Keys da Tabela Invoices',
          status: 'error',
          message: 'Erro ao verificar foreign keys',
          details: fkError
        });
      } else {
        const hasClientFK = foreignKeys?.some((fk: any) => 
          fk.column_name === 'client_id' && fk.foreign_table_name === 'clients'
        );
        
        checks.push({
          name: 'Foreign Keys da Tabela Invoices',
          status: hasClientFK ? 'success' : 'warning',
          message: hasClientFK 
            ? 'Foreign key client_id -> clients existe' 
            : 'Foreign key client_id -> clients não encontrada',
          details: foreignKeys
        });
      }

      // 3. Verificar políticas RLS
      const { data: rlsPolicies, error: rlsError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename IN ('invoices', 'clients')
          ORDER BY tablename, policyname;
        `
      });

      if (rlsError) {
        checks.push({
          name: 'Políticas RLS',
          status: 'error',
          message: 'Erro ao verificar políticas RLS',
          details: rlsError
        });
      } else {
        const invoicePolicies = rlsPolicies?.filter((p: any) => p.tablename === 'invoices') || [];
        const clientPolicies = rlsPolicies?.filter((p: any) => p.tablename === 'clients') || [];
        
        checks.push({
          name: 'Políticas RLS',
          status: (invoicePolicies.length > 0 && clientPolicies.length > 0) ? 'success' : 'warning',
          message: `Invoices: ${invoicePolicies.length} políticas, Clients: ${clientPolicies.length} políticas`,
          details: { invoicePolicies, clientPolicies }
        });
      }

      // 4. Verificar conectividade com Supabase
      const { data: connectionTest, error: connError } = await supabase.rpc('execute_sql', {
        query: 'SELECT NOW() as current_time, version() as pg_version;'
      });

      checks.push({
        name: 'Conectividade Supabase',
        status: connError ? 'error' : 'success',
        message: connError ? 'Erro de conectividade' : 'Conectividade OK',
        details: connError || connectionTest
      });

      // 5. Verificar autenticação
      const { data: authTest, error: authError } = await supabase.rpc('execute_sql', {
        query: 'SELECT auth.uid() as user_id, auth.role() as user_role;'
      });

      checks.push({
        name: 'Autenticação',
        status: authError ? 'error' : 'success',
        message: authError ? 'Erro de autenticação' : `Usuário autenticado: ${authTest?.[0]?.user_id}`,
        details: authError || authTest
      });

    } catch (error: any) {
      checks.push({
        name: 'Sistema Geral',
        status: 'error',
        message: 'Erro geral no sistema de debug',
        details: error.message
      });
    }

    setSystemChecks(checks);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const quickQueries = [
    {
      name: 'Estrutura Invoices',
      query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'invoices' AND table_schema = 'public' ORDER BY ordinal_position;`
    },
    {
      name: 'Estrutura Clients',
      query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'clients' AND table_schema = 'public' ORDER BY ordinal_position;`
    },
    {
      name: 'Foreign Keys',
      query: `SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('invoices', 'clients') ORDER BY tc.table_name;`
    },
    {
      name: 'Teste JOIN Invoices-Clients',
      query: `SELECT i.id, i.total_amount, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LIMIT 5;`
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Sistema de Debug - Superadmin
          </CardTitle>
          <CardDescription>
            Ferramentas de diagnóstico e debug para identificar e resolver problemas do sistema.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="system-checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system-checks" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Verificações do Sistema
          </TabsTrigger>
          <TabsTrigger value="sql-console" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Console SQL
          </TabsTrigger>
          <TabsTrigger value="quick-queries" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Consultas Rápidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-checks">
          <Card>
            <CardHeader>
              <CardTitle>Verificações Automáticas do Sistema</CardTitle>
              <CardDescription>
                Execute verificações automáticas para identificar problemas comuns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runSystemChecks} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Executando...' : 'Executar Verificações'}
              </Button>

              {systemChecks.length > 0 && (
                <div className="space-y-3">
                  {systemChecks.map((check, index) => (
                    <Alert key={index}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <div>
                            <h4 className="font-medium">{check.name}</h4>
                            <AlertDescription>{check.message}</AlertDescription>
                          </div>
                        </div>
                        {getStatusBadge(check.status)}
                      </div>
                      {check.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql-console">
          <Card>
            <CardHeader>
              <CardTitle>Console SQL</CardTitle>
              <CardDescription>
                Execute consultas SQL diretamente no banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite sua consulta SQL aqui..."
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={6}
                className="font-mono"
              />
              <Button 
                onClick={executeSqlQuery} 
                disabled={isRunning || !sqlQuery.trim()}
                className="w-full"
              >
                {isRunning ? 'Executando...' : 'Executar Consulta'}
              </Button>

              {debugResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Resultados:</h3>
                  {debugResults.map((result, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            {result.timestamp.toLocaleTimeString()}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {result.duration && (
                              <Badge variant="outline">{result.duration}ms</Badge>
                            )}
                            {result.error ? (
                              <Badge variant="destructive">ERRO</Badge>
                            ) : (
                              <Badge variant="default">SUCESSO</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Consulta:</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                            {result.query}
                          </pre>
                        </div>
                        {result.error ? (
                          <div>
                            <h4 className="text-sm font-medium mb-1 text-red-600">Erro:</h4>
                            <pre className="text-xs bg-red-50 p-2 rounded overflow-auto text-red-800">
                              {result.error}
                            </pre>
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Resultado:</h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify(result.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-queries">
          <Card>
            <CardHeader>
              <CardTitle>Consultas Rápidas</CardTitle>
              <CardDescription>
                Consultas pré-definidas para diagnósticos comuns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{query.name}</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {query.query.substring(0, 100)}...
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSqlQuery(query.query)}
                  >
                    Usar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}