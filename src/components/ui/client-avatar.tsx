import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClientAvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "active" | "inactive" | "pending" | "defaulter";
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24"
};

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  pending: "bg-yellow-500",
  defaulter: "bg-red-500"
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientAvatar({ 
  name, 
  imageUrl, 
  size = "md", 
  status, 
  className,
  showStatus = false 
}: ClientAvatarProps) {
  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showStatus && status && (
        <div 
          className={cn(
            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
            statusColors[status]
          )}
          title={status === "active" ? "Ativo" : status === "inactive" ? "Inativo" : "Pendente"}
        />
      )}
    </div>
  );
}