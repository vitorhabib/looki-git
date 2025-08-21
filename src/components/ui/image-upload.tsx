'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-24 w-24'
};

const buttonSizeClasses = {
  sm: 'h-6 w-6 -bottom-1 -right-1',
  md: 'h-8 w-8 -bottom-2 -right-2',
  lg: 'h-10 w-10 -bottom-2 -right-2'
};

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  loading = false,
  fallback = 'U',
  className,
  size = 'md'
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !loading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || loading) return;
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onChange(imageFile);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-200',
          dragOver && 'scale-105',
          (disabled || loading) && 'cursor-not-allowed opacity-50'
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-dashed border-transparent', dragOver && 'border-primary')}>
          <AvatarImage src={value} alt="Upload preview" />
          <AvatarFallback className="text-lg font-medium">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fallback
            )}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload button */}
        <Button
          size="sm"
          variant="outline"
          className={cn(
            'absolute rounded-full p-0 shadow-md',
            buttonSizeClasses[size]
          )}
          disabled={disabled || loading}
          type="button"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
        
        {/* Remove button */}
        {value && onRemove && !loading && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
            onClick={handleRemove}
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />
      
      {/* Drag and drop hint */}
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full border-2 border-primary border-dashed">
          <p className="text-xs font-medium text-primary">Solte aqui</p>
        </div>
      )}
    </div>
  );
}