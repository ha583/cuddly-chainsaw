
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  error, 
  className, 
  icon, 
  type = "text",
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  return (
    <div className="space-y-2 animate-fade-in">
      <label className="block text-sm font-medium text-foreground/80 transition-colors">
        {label}
      </label>
      <div className={cn(
        "relative rounded-lg border transition-all duration-200 ease-in-out",
        focused ? "ring-2 ring-ring/30 border-ring" : "border-border",
        error ? "border-destructive ring-destructive/20" : ""
      )}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        <input
          type={inputType}
          className={cn(
            "w-full bg-background px-3 py-2.5 rounded-lg text-sm placeholder:text-muted-foreground/70 transition-colors",
            icon ? "pl-10" : "",
            className
          )}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff size={18} className="opacity-70 hover:opacity-100" />
            ) : (
              <Eye size={18} className="opacity-70 hover:opacity-100" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-destructive text-xs animate-slide-up">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
