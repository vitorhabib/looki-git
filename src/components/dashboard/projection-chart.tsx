'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, BarChart3, Eye, EyeOff } from "lucide-react";
import { 
  ComposedChart,
  Line,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { useInvoices } from "@/hooks/useInvoices";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";



const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function ProjectionChart() {
  const { currentOrganization } = useAuth();
  const { invoices } = useInvoices();
  const { expensesList } = useExpenses(currentOrganization?.id);
  const [showProjections, setShowProjections] = useState(true);
  const [periodMonths, setPeriodMonths] = useState(12);

  const projectionData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Gerar dados para os últimos 6 meses + próximos 6 meses
    const data = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Calcular receitas recorrentes mensais
    const recurringRevenue = invoices
      .filter(invoice => invoice.is_recurring && invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    // Calcular média de despesas dos últimos 6 meses
    const recentExpenses = expensesList
      .filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        const monthsAgo = (currentYear - expenseDate.getFullYear()) * 12 + (currentMonth - expenseDate.getMonth());
        return monthsAgo >= 0 && monthsAgo < 6;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const avgMonthlyExpenses = recentExpenses / 6 || 0;
    
    for (let i = -6; i < 6; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const monthIndex = targetDate.getMonth();
      const year = targetDate.getFullYear();
      const isHistorical = i < 0;
      const isCurrent = i === 0;
      
      let receitas = 0;
      let despesas = 0;
      
      if (isHistorical || isCurrent) {
        // Dados históricos reais
        receitas = invoices
          .filter(invoice => {
            const invoiceDate = new Date(invoice.issue_date);
            return invoiceDate.getMonth() === monthIndex && 
                   invoiceDate.getFullYear() === year && 
                   invoice.status === 'paid';
          })
          .reduce((sum, invoice) => sum + invoice.total_amount, 0);
        
        despesas = expensesList
          .filter(expense => {
            const expenseDate = new Date(expense.expense_date);
            return expenseDate.getMonth() === monthIndex && 
                   expenseDate.getFullYear() === year;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
      } else {
        // Projeções futuras
        receitas = recurringRevenue + (recurringRevenue * 0.05 * i); // 5% crescimento projetado
        despesas = avgMonthlyExpenses * (1 + 0.02 * i); // 2% inflação projetada
      }
      
      const saldo = receitas - despesas;
      
      data.push({
        month: monthNames[monthIndex],
        fullDate: `${monthNames[monthIndex]}/${year}`,
        receitas,
        despesas,
        saldo,
        isHistorical,
        isProjected: !isHistorical && !isCurrent,
        isCurrent
      });
    }
    
    return data;
  }, [invoices, expensesList]);

  // Calcular estatísticas
  const currentMonthData = projectionData.find(d => d.isCurrent);
  const nextMonthData = projectionData.find((d, i) => projectionData[i-1]?.isCurrent);
  const avgGrowth = projectionData
    .filter(d => d.isHistorical)
    .reduce((acc, d, i, arr) => i > 0 ? acc + ((d.saldo - arr[i-1].saldo) / Math.abs(arr[i-1].saldo || 1)) : acc, 0) / 5;

  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div>Projeção de Fluxo de Caixa</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Próximo mês: {formatCurrency(nextMonthData?.saldo || 0)} 
                <Badge variant={avgGrowth > 0 ? "default" : "destructive"} className="ml-2">
                  {avgGrowth > 0 ? '+' : ''}{(avgGrowth * 100).toFixed(1)}% tendência
                </Badge>
              </div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showProjections ? "default" : "outline"}
              size="sm"
              onClick={() => setShowProjections(!showProjections)}
              className="flex items-center gap-1"
            >
              {showProjections ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Projeções
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 rounded-lg" />
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
                <pattern id="projectedPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent"/>
                  <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const isProjected = props.payload?.isProjected;
                  const prefix = isProjected ? '~' : '';
                  return [prefix + formatCurrency(value), name];
                }}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  if (data) {
                    const type = data.isProjected ? ' (Projetado)' : data.isCurrent ? ' (Atual)' : ' (Histórico)';
                    return `${data.fullDate}${type}`;
                  }
                  return label;
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '600' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
              
              {/* Área de receitas */}
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#colorReceitas)"
                name="Receitas"
              />
              
              {/* Linha de despesas - histórica */}
              <Line
                type="monotone"
                dataKey="despesas"
                stroke="hsl(var(--danger))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--danger))', strokeWidth: 2, r: 3 }}
                name="Despesas"
                connectNulls={false}
                data={projectionData.filter(d => !d.isProjected || showProjections)}
              />
              
              {/* Linha de despesas - projetada */}
              {showProjections && (
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 3, opacity: 0.7 }}
                  name="Despesas (Proj.)"
                  connectNulls={false}
                  data={projectionData.filter(d => d.isProjected || d.isCurrent)}
                />
              )}
              
              {/* Linha de saldo - histórica */}
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Saldo"
                connectNulls={false}
                data={projectionData.filter(d => !d.isProjected || showProjections)}
              />
              
              {/* Linha de saldo - projetada */}
              {showProjections && (
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4, opacity: 0.7 }}
                  name="Saldo (Proj.)"
                  connectNulls={false}
                  data={projectionData.filter(d => d.isProjected || d.isCurrent)}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda personalizada */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full opacity-60"></div>
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-danger"></div>
            <span>Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span>Saldo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground border-dashed border-t"></div>
            <span className="text-muted-foreground">Projetado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}