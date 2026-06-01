import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onFileRemoved: (url: string) => void;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadComplete, 
  onFileRemoved,
  maxFiles = 5 
}) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files permitted.`);
      return;
    }

    setUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      try {
        const { data, error } = await supabase.storage
          .from('tickets')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('tickets')
          .getPublicUrl(data.path);

        const newFile = { name: file.name, url: publicUrl };
        setFiles(prev => [...prev, newFile]);
        onUploadComplete(publicUrl);
        toast.success(`${file.name} uploaded`);
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('row-level security')) {
          toast.error("Storage Error: RLS policy violation. Please update 'tickets' bucket policies in Supabase to allow INSERT activities.");
        } else if (err.message && err.message.toLowerCase().includes('bucket not found')) {
          toast.error(`Storage Error: Supabase could not find the 'tickets' bucket. Please ensure you created a bucket named exactly 'tickets' and set it to PUBLIC.`);
        } else {
          toast.error(`Upload error: ${err.message}`);
        }
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = async (url: string) => {
    // Delete from state immediately
    const fileToRemove = files.find(f => f.url === url);
    setFiles(prev => prev.filter(f => f.url !== url));
    
    // Notify parent to remove from form state
    onFileRemoved(url);

    // Prompt logic: "if a user uploads a file but clicks an 'X' to remove it from the form... 
    // the system must execute an API call to permanently delete the orphaned file from the cloud bucket"
      try {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        
        const { error } = await supabase.storage
          .from('tickets')
          .remove([fileName]);

        if (error) throw error;
        toast.info(`Orphaned archive ${fileToRemove?.name} purged from storage`);
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('row-level security')) {
            console.error("Bucket 'tickets' RLS policy prevents deletion.");
            toast.error("Storage Error: RLS policy prevents file deletion. Please allow DELETE on 'tickets' bucket.");
        } else if (err.message && err.message.toLowerCase().includes('bucket not found')) {
            console.error("Bucket 'tickets' not found for deletion.");
        } else {
            console.error('Purge error:', err);
        }
      }
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-brand-border rounded-xl p-8 transition-all cursor-pointer hover:border-brand-gold/50 flex flex-col items-center justify-center gap-3 bg-bg-elevated/30",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-text-secondary" />
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-text-primary uppercase tracking-wider">Deploy Archives</p>
          <p className="text-[10px] text-text-secondary font-medium mt-1">Images or PDFs (Max {maxFiles} files)</p>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          multiple 
          accept="image/*,application/pdf"
          onChange={handleUpload}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-bg-base border border-brand-border rounded-lg group">
              <div className="w-8 h-8 bg-brand-gold/10 flex items-center justify-center rounded">
                {file.name.endsWith('.pdf') ? (
                  <FileText className="w-4 h-4 text-brand-gold" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-brand-gold" />
                )}
              </div>
              <span className="text-[10px] font-bold text-text-primary truncate flex-grow uppercase tracking-tight">
                {file.name}
              </span>
              <button 
                type="button"
                onClick={() => removeFile(file.url)}
                className="p-1.5 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
