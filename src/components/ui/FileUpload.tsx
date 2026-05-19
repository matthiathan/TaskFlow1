import React, { useState } from 'react';
import { UploadCloud, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FileUploadProps {
  bucket: string;
  folderPath: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  bucket, 
  folderPath, 
  onUploadComplete,
  accept = "image/*,application/pdf",
  maxSizeMB = 5
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Generate unique secure filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Push to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
    } catch (err: any) {
      setError(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed border-brand-border bg-bg-surface hover:bg-bg-elevated transition-colors rounded-sm p-6 flex flex-col items-center justify-center text-center">
        <input 
          type="file" 
          accept={accept}
          onChange={handleUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center text-brand-gold">
            <Loader2 size={24} className="animate-spin mb-2" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Encrypting & Transmitting...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-text-muted hover:text-brand-gold transition-colors">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-text-primary">
              Initialize Upload
            </span>
            <span className="text-[9px] mt-1">Images & PDFs up to {maxSizeMB}MB</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold mt-2 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
};
