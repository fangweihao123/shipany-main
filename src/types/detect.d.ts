// AI Image Detection Types

// API Provider Types
export type DetectionProvider = 'undetectable' | 'sightengine';

// Undetectable AI Types
export interface PreSignedUrlRequest {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface PreSignedUrlResponse {
  success: boolean;
  presigned_url: string;
  image_url: string;
  upload_id: string;
}

export interface DetectionRequest {
  image_url: string;
  generate_preview?: boolean;
  document_type?: string;
}

export interface DetectionResponse {
  success: boolean;
  result: {
    prediction: "AI Generated" | "Not AI Generated";
    confidence: number;
    confidence_percentage: string;
  };
  upload_id: string;
  image_url: string;
  preview_url?: string;
  processing_time: number;
}

export interface DetectionQueryResponse {
  success: boolean;
  status: "pending" | "completed" | "failed";
  result?: {
    prediction: "AI Generated" | "Not AI Generated";
    confidence: number;
    confidence_percentage: string;
  };
}

export interface UserCreditsResponse {
  success: boolean;
  credits: number;
  credits_used: number;
  credits_remaining: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: string;
  };
}

// Sightengine API Types
export interface SightengineDetectionRequest {
  media: File;
  models: string;
  api_user: string;
  api_secret: string;
}

export interface SightengineDetectionResponse {
  status: "success" | "failure";
  request: {
    id: string;
    timestamp: number;
    operations: number;
  };
  type: {
    ai_generated: number;
  };
  media: {
    id: string;
    uri: string;
  };
}

// Unified Detection Response
export interface UnifiedDetectionResponse {
  success: boolean;
  provider: DetectionProvider;
  result: {
    prediction: "AI Generated" | "Not AI Generated";
    confidence: number;
    confidence_percentage: string;
    raw_score?: number; // For Sightengine raw score
  };
  upload_id?: string;
  image_url?: string;
  preview_url?: string;
  processing_time?: number;
  request_id?: string; // For Sightengine request ID
}

// Client-side types
export interface DetectionState {
  isLoading: boolean;
  isUploading: boolean;
  isDetecting: boolean;
  result: UnifiedDetectionResponse | null;
  error: string | null;
  uploadProgress: number;
  provider: DetectionProvider;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
  isValid: boolean;
  error: string | null;
}

// Supported file types
export type SupportedImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic' | 'avif' | 'bmp' | 'tiff';

export interface ImageDetectionConfig {
  maxFileSize: number; // 10MB
  minFileSize: number; // 1KB
  supportedFormats: SupportedImageFormat[];
  apiBaseUrl: string;
}