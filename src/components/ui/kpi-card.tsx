import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  loading = false
}: KpiCardProps) {
  const variants = {
    default: {
      bg: 'bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50',
      iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-slate-200/60 dark:border-slate-700/60',
      shadow: 'shadow-sm hover:shadow-lg',
      accent: 'before:bg-gradient-to-r before:from-blue-500 before:to-blue-600'
    },
    success: {
      bg: 'bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-green-900/10',
      iconBg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
      iconColor: 'text-green-600 dark:text-green-400',
      border: 'border-green-200/60 dark:border-green-700/30',
      shadow: 'shadow-sm hover:shadow-lg hover:shadow-green-500/10',
      accent: 'before:bg-gradient-to-r before:from-green-500 before:to-emerald-600'
    },
    warning: {
      bg: 'bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-900/10',
      iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/60 dark:border-amber-700/30',
      shadow: 'shadow-sm hover:shadow-lg hover:shadow-amber-500/10',
      accent: 'before:bg-gradient-to-r before:from-amber-500 before:to-orange-600'
    },
    danger: {
      bg: 'bg-gradient-to-br from-white to-red-50/30 dark:from-slate-800 dark:to-red-900/10',
      iconBg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30',
      iconColor: 'text-red-600 dark:text-red-400',
      border: 'border-red-200/60 dark:border-red-700/30',
      shadow: 'shadow-sm hover:shadow-lg hover:shadow-red-500/10',
      accent: 'before:bg-gradient-to-r before:from-red-500 before:to-rose-600'
    }
  };

  const config = variants[variant];

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 w-8 bg-muted rounded-lg"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-32 mb-2"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1',
      'before:absolute before:inset-x-0 before:top-0 before:h-1 before:transition-all before:duration-300',
      'hover:before:h-2',
      config.bg,
      config.border,
      config.shadow,
      config.accent,
      'backdrop-blur-sm',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            'p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
            'shadow-sm group-hover:shadow-md',
            config.iconBg
          )}>
            <Icon className={cn('h-5 w-5 transition-all duration-300', config.iconColor)} />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-3xl font-bold text-foreground mb-2 transition-all duration-300 group-hover:scale-105">
          {value}
        </div>
        {trend && (
          <div className={cn(
            'text-sm flex items-center gap-2 px-2 py-1 rounded-full w-fit transition-all duration-300',
            'group-hover:scale-105',
            trend.isPositive 
              ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20' 
              : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
          )}>
            <span className={cn(
              'inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold',
              trend.isPositive 
                ? 'bg-green-600 text-white dark:bg-green-500' 
                : 'bg-red-600 text-white dark:bg-red-500'
            )}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            <span className="font-medium">
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}