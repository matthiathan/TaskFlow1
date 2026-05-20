import React, { useState } from 'react';
import { X, LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ id, isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div 
        id={id}
        className="relative bg-bg-base border border-brand-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <h2 className="text-xl font-bold tracking-tight text-text-primary font-serif uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
