import { cn } from "@/lib/utils";

interface MoneyProps {
  valueCents: number;
  className?: string;
  showCurrency?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'muted';
}

export function Money({ 
  valueCents, 
  className, 
  showCurrency = true,
  variant = 'default'
}: MoneyProps) {
  const value = valueCents / 100;
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const isNegative = value < 0;
  
  const variants = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-danger',
    muted: 'text-muted-foreground'
  };

  return (
    <span 
      className={cn(
        'font-mono font-medium tabular-nums',
        variants[variant],
        isNegative && variant === 'default' && 'text-danger',
        className
      )}
    >
      {isNegative && '- '}
      {formatted}
    </span>
  );
}