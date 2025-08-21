import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant = 
  | 'paid' | 'overdue' | 'cancelled' | 'draft' | 'sent'
  | 'pending' | 'active' | 'inactive' | 'defaulter' | 'provisioned'
  | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const statusConfig = {
  // Invoice statuses
  paid: { label: 'Pago', variant: 'success' as const },
  overdue: { label: 'Vencido', variant: 'danger' as const },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const },
  draft: { label: 'Rascunho', variant: 'secondary' as const },
  sent: { label: 'Enviada', variant: 'info' as const },
  
  // Expense statuses
  pending: { label: 'Pendente', variant: 'warning' as const },
  
  // General statuses
  active: { label: 'Ativo', variant: 'success' as const },
  inactive: { label: 'Desativado', variant: 'secondary' as const },
  defaulter: { label: 'Inadimplente', variant: 'danger' as const },
  provisioned: { label: 'Provisionado', variant: 'info' as const },
  
  // Semantic statuses
  success: { label: 'Sucesso', variant: 'success' as const },
  warning: { label: 'Atenção', variant: 'warning' as const },
  danger: { label: 'Erro', variant: 'danger' as const },
  info: { label: 'Info', variant: 'info' as const },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}