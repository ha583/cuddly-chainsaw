
import React from 'react';
import { cn } from "@/lib/utils";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'default' | 'outline';
}

const AuthButton: React.FC<AuthButtonProps> = ({
  className,
  children,
  loading = false,
  variant = 'default',
  ...props
}) => {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none w-full",
        variant === 'default' ? 
          "bg-primary text-primary-foreground shadow hover:bg-primary/90" :
          "border border-input bg-transparent hover:bg-secondary text-foreground",
        loading && "cursor-wait",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
        </div>
      ) : null}
      <span className={cn(loading ? "opacity-0" : "opacity-100")}>{children}</span>
    </button>
  );
};

export default AuthButton;
