import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-gold text-brand-charcoal hover:bg-[#C29F2E] active:scale-[0.98]',
    secondary: 'bg-brand-charcoal text-white hover:opacity-90',
    outline: 'border border-brand-border bg-bg-elevated text-text-primary hover:bg-bg-hover',
    ghost: 'text-text-primary hover:bg-text-primary/5',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full shadow-sm" />
      ) : null}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-serif uppercase tracking-widest text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-bg-elevated border ${error ? 'border-red-500' : 'border-brand-border text-text-primary'} px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors duration-200 placeholder:text-text-muted/50 ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-bg-elevated border border-brand-border shadow-sm rounded-sm ${className}`}>
    {children}
  </div>
);
