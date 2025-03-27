
import React from 'react';
import { cn } from "@/lib/utils";

interface AuthToggleProps {
  value: 'signin' | 'signup';
  onChange: (value: 'signin' | 'signup') => void;
}

const AuthToggle: React.FC<AuthToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex rounded-lg p-1 bg-secondary border border-border/50 w-full">
      <button
        type="button"
        className={cn(
          "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200",
          value === 'signin' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-secondary-foreground/10 text-foreground"
        )}
        onClick={() => onChange('signin')}
      >
        Sign In
      </button>
      <button
        type="button"
        className={cn(
          "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200",
          value === 'signup' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-secondary-foreground/10 text-foreground"
        )}
        onClick={() => onChange('signup')}
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthToggle;
