"use client";

import { useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { FileUploadState } from '@/types/detect';
import { cn } from '@/lib/utils';
import { Upload as DetectUpload} from '@/types/blocks/detect';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  fileState: FileUploadState;
  isLoading: boolean;
  upload?: DetectUpload;
  fileDuration?: number;
  supportType?: string[];
}

export function FileUpload({ 
    onFileSelect, 
    fileState, 
    isLoading,
    upload,
    fileDuration,
    supportType = ['JPG', 'PNG', 'WebP', 'HEIC', 'AVIF', 'BMP']
  }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  }, [isLoading]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Reset to empty state by passing null - this will trigger validation and set isValid to false
    onFileSelect(null as any);
  }, [onFileSelect]);

  const supportText =(upload?.support_format || 'Supports {formats}').replace('{formats}', supportType.join(', '));
  const durationTips =(upload?.duration_limit_tip || 'Supports {seconds} seconds duration file').replace('{seconds}', String(fileDuration ?? 10));
  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
            isLoading ? "cursor-not-allowed opacity-50" : "hover:border-gray-400",
            fileState.error ? "border-red-300 bg-red-50" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isLoading}
          />

          {fileState.preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={fileState.preview}
                  alt="Preview"
                  className="max-h-48 max-w-full rounded-lg shadow-md"
                />
                {!isLoading && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {!isLoading && (
                <p className="text-sm text-gray-600">
                  {upload?.click_different_file ?? "Click to select a different image"} 
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className={cn(
                  "w-6 h-6",
                  isDragOver ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {upload?.upload_title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {upload?.drag_drop_text ?? "Drag and drop your image here, or click to select"} 
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {supportText}
                </p>
                {fileDuration && (
                  <p className="text-xs text-gray-500">
                    {durationTips}
                  </p>
                )}
              </div>

              {!isLoading && (
                <Button variant="outline" size="sm">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {upload?.select_tip}
                </Button>
              )}
            </div>
          )}
        </div>

        {fileState.error && (
          <p className="mt-3 text-sm text-red-600">
            {fileState.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}