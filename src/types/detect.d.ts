// AI Image Detection Types

// API Provider Types
export type DetectionProvider = 'undetectableimg' | 'undetectablemp3' | 'undetectabletext' | 'sightengineimg' | 'sightenginemp3';

// Undetectable AI Types
export interface PreSignedUrlRequest {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface PreSignedUrlResponse {
  status: string;
  presigned_url: string;
  file_path: string;
}

export interface DetectionImgRequest {
    key: string;
    url: string;
    generate_preview: boolean;
}

export interface DetectionImgResponse{
  id: string;
  status: string;
}

export interface DetectionAudRequest {
  key: string;
  url: string;
  document_type: string;
  analyzeUpToSeconds: number;
}

export interface DetectionAudioResponse{
  id: string;
  status: string;
}

export interface DetectionTextRequest {
  text: string;
  key: string;
  model: string;
  retry_count: number;
}

export interface DetectionTextResponse {
  id: string;
  input: string;
  model: string;
  result: null;
  result_details: null;
  status: string;
  retry_count: number;
}

export interface DetectionQueryRequest{
  type: string;
  id: string;
}

export interface DetectionAudioQueryResponse{
  id: string;
  status: string;
  result: number;
  result:{
    is_valid: boolean;
    message: string;
    original_duration: number;
    is_truncated: boolean;
    truncated_duration: number;
    mean_ai_prob: number;
    individual_chunks_ai_prob: number[];
  }
}

export interface DetectionImageQueryResponse{
  id: string;
  status: string;
  result: number;
  result_details:{
    is_valid: boolean;
    detection_step: number;
    final_result: string;
    confidence: number;
  }
  preview_url: string;
}

export interface DetectionTextQueryResponse{
  id: string;
  model: string;
  result: number;
  result_details: {
    scoreGptZero: number;
    scoreOpenAI: number;
    scoreWriter: number;
    scoreCrossPlag: number;
    scoreCopyLeaks: number;
    scoreSapling: number;
    scoreContentAtScale: number;
    scoreZeroGPT: number;
    human: number;
  };
  status: string;
  retry_count: number;
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

export interface DetectionAudioQueryResponse {
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
  isFinished: boolean;
  result: any;
  error: string | null;
  uploadProgress: number;
  provider: DetectionProvider;
  detectionId?: string;
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

// Supported file types
export type SupportedImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic' | 'avif' | 'bmp' | 'tiff';

export interface ImageDetectionConfig {
  maxFileSize: number; // 10MB
  minFileSize: number; // 1KB
  supportedFormats: SupportedImageFormat[];
  apiBaseUrl: string;
}