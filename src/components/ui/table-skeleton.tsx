import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true, 
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={cn(
                      "h-4",
                      colIndex === 0 ? "w-32" : colIndex === columns - 1 ? "w-16" : "w-24"
                    )} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Skeleton específico para lista de faturas
export function InvoiceTableSkeleton() {
  return (
    <TableSkeleton 
      rows={8} 
      columns={6} 
      className="border rounded-lg"
    />
  );
}

// Skeleton específico para lista de clientes
export function ClientTableSkeleton() {
  return (
    <TableSkeleton 
      rows={6} 
      columns={5} 
      className="border rounded-lg"
    />
  );
}

// Skeleton específico para lista de despesas
export function ExpenseTableSkeleton() {
  return (
    <TableSkeleton 
      rows={7} 
      columns={6} 
      className="border rounded-lg"
    />
  );
}