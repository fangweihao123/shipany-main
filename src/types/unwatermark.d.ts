// AI Image Detection Types

// API Provider Types
export type UnwatermarkProvider = 'wavespeedunwatermarkimg' | 'wavespeedremovebg';

export interface UnwatermarkImgRequest {
    image: string;
    output_format?: string;
    enable_base64_output?: boolean;
    enable_sync_mode?: boolean;
}

export interface UnwatermarkImgResponse{
  id: string;
  model: string;
  outputs: [];
  status: string;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
  isValid: boolean;
  error: string | null;
  duration?: number
}

export interface TextInputState {
  text: string;
  isValid: boolean;
  error: string | null;
  wordCount: number;
}
// Client-side types
export interface UnwatermarkState {
  isUploading: boolean;
  isDetecting: boolean;
  isFinished: boolean;
  result: any;
  error: string | null;
  uploadProgress: number;
  provider: UnwatermarkProvider;
  taskId?: string;
}

// Supported file types
export type SupportedImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic' | 'avif' | 'bmp' | 'tiff';

export interface ImageDetectionConfig {
  maxFileSize: number; // 10MB
  minFileSize: number; // 1KB
  supportedFormats: SupportedImageFormat[];
  apiBaseUrl: string;
}