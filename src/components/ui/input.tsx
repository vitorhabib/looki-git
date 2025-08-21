import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border-2 bg-background px-4 py-3 text-base transition-all duration-300",
            "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground/60 placeholder:transition-all placeholder:duration-300",
            "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // Default state
            "border-input hover:border-input/80",
            // Focus state
            isFocused && "border-primary shadow-lg shadow-primary/10 placeholder:text-muted-foreground/40",
            // Error state
            error && "border-destructive bg-destructive/5 focus-visible:border-destructive shadow-lg shadow-destructive/10",
            // Success state
            success && "border-success bg-success/5 focus-visible:border-success shadow-lg shadow-success/10",
            // Has value state
            hasValue && !error && !success && "border-primary/60",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {/* Visual indicators */}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </div>
        )}
        
        {success && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        )}
        
        {/* Focus indicator line */}
        <div className={cn(
          "absolute bottom-0 left-1/2 h-0.5 bg-primary transition-all duration-300 transform -translate-x-1/2",
          isFocused ? "w-full" : "w-0",
          error && "bg-destructive",
          success && "bg-success"
        )} />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
