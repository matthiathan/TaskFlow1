import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Base';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-xl'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-[2px]" 
        onClick={onClose}
      />
      <div className={`relative w-full ${maxWidth} bg-white rounded-sm shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <h2 className="text-xl font-serif text-brand-charcoal uppercase tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-brand-charcoal/40 hover:text-brand-charcoal transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 shadow-sm" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="p-6 border-t border-brand-border flex items-center justify-end gap-3 bg-brand-light/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
