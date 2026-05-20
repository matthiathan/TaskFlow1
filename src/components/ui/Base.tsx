import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * BUTTON COMPONENT
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-gold text-white hover:bg-brand-gold-dark shadow-sm',
      secondary: 'bg-bg-elevated text-text-primary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-brand-border',
      outline: 'bg-transparent border border-brand-gold text-brand-gold hover:bg-brand-gold/10',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * CARD COMPONENT
 */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('bg-bg-elevated border border-brand-border rounded-xl overflow-hidden shadow-sm', className)} {...props}>
    {children}
  </div>
);

/**
 * INPUT COMPONENT
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const uniqueId = id || React.useId();
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={uniqueId} className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={uniqueId}
          ref={ref}
          className={cn(
            'w-full bg-bg-base border px-3 py-2 text-sm font-medium transition-all duration-200',
            'input-recessed rounded-lg outline-none placeholder:text-text-secondary/40',
            error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide px-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * TEXTAREA COMPONENT
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const uniqueId = id || React.useId();
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={uniqueId} className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={uniqueId}
          ref={ref}
          className={cn(
            'w-full bg-bg-base border px-3 py-2 text-sm font-medium transition-all duration-200 min-h-[120px] resize-y',
            'input-recessed rounded-lg outline-none placeholder:text-text-secondary/40',
            error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-brand-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide px-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
