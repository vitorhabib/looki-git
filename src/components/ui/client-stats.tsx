import { Card, CardContent } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { 
  DollarSign, 
  Clock, 
  Repeat, 
  TrendingUp,
  FileText,
  AlertCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueClassName?: string;
}

function StatCard({ title, value, icon, trend, className, valueClassName }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={cn("text-2xl font-bold", valueClassName)}>
                {value}
              </p>
            </div>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              <TrendingUp className={cn(
                "h-4 w-4 mr-1",
                !trend.isPositive && "rotate-180"
              )} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ClientStatsProps {
  openInvoices: number;
  overdueInvoices: number;
  activeServices: number;
  totalInvoices: number;
}

export function ClientStats({ 
  openInvoices, 
  overdueInvoices, 
  activeServices, 
  totalInvoices 
}: ClientStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Faturas em Aberto</p>
              <p className="text-3xl font-bold text-blue-700">{openInvoices}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Faturas Vencidas</p>
              <p className="text-3xl font-bold text-red-700">{overdueInvoices}</p>
            </div>
            <div className="p-3 bg-red-500 rounded-xl shadow-md">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Serviços Ativos</p>
              <p className="text-3xl font-bold text-green-700">{activeServices}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Total de Faturas</p>
              <p className="text-3xl font-bold text-purple-700">{totalInvoices}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}