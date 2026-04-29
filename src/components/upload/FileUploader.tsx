import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';

interface FileUploaderProps {
  onUpload: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  label?: string;
  existingFiles?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export function FileUploader({
  onUpload,
  accept = 'image/*,application/pdf',
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 5,
  bucket = 'uploads',
  folder = 'files',
  label = 'Glissez vos fichiers ici ou cliquez pour sélectionner',
  existingFiles = [],
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingFiles);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, index: number): Promise<string | null> => {
    if (!supabase) {
      console.error('[v0] Supabase not configured');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      // Update progress
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading' as const, progress: 30 } : f
      ));

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'success' as const, progress: 100, url: publicUrl } : f
      ));

      return publicUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error' as const, error: errorMessage } : f
      ));
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate
    if (uploadedUrls.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`${file.name} dépasse la taille maximale de ${maxSizeMB}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    const startIndex = uploadingFiles.length;
    const urls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const url = await uploadFile(validFiles[i], startIndex + i);
      if (url) urls.push(url);
    }

    // Update uploaded URLs
    const newUrls = [...uploadedUrls, ...urls];
    setUploadedUrls(newUrls);
    onUpload(newUrls);

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.status !== 'success'));
    }, 2000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [uploadedUrls]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (urlToRemove: string) => {
    const newUrls = uploadedUrls.filter(url => url !== urlToRemove);
    setUploadedUrls(newUrls);
    onUpload(newUrls);
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxSizeMB}MB par fichier • {maxFiles} fichiers max
        </p>
      </div>

      {/* Uploading files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {file.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {file.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {file.status === 'pending' && <Upload className="h-5 w-5 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.file.name}</p>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
                {file.error && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files preview */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploadedUrls.map((url, index) => (
            <div key={index} className="relative group">
              {isImage(url) ? (
                <img
                  src={url}
                  alt={`Fichier ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-2">PDF</span>
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(url);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple contract uploader
export function ContractUploader({
  onUpload,
  existingUrl,
}: {
  onUpload: (url: string | null) => void;
  existingUrl?: string;
}) {
  return (
    <FileUploader
      accept="application/pdf,.doc,.docx"
      multiple={false}
      maxFiles={1}
      maxSizeMB={10}
      folder="contracts"
      label="Glissez votre contrat de bail ici (PDF, Word)"
      existingFiles={existingUrl ? [existingUrl] : []}
      onUpload={(urls) => onUpload(urls[0] || null)}
    />
  );
}
