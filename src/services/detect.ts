import {
  ApiErrorResponse,
  ImageDetectionConfig,
  DetectionImgResponse,
  DetectionProvider,
  DetectionAudioResponse,
  DetectionTextResponse,
  DetectionQueryRequest,
  TextInputState
} from '@/types/detect';
import { stat } from 'fs';
import { resolve } from 'path';

export const DETECTION_CONFIG: ImageDetectionConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 1024, // 1KB
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'],
  apiBaseUrl: '/api/detect',
};

export const PROVIDER_CONFIGS = {
  undetectableimg: {
    name: 'Undetectable AI Img',
    description: 'Advanced AI detection with high accuracy',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/detect/undetectable/img',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'] as const,
  },
  undetectablemp3: {
    name: 'Undetectable AI Mp3',
    description: 'Advanced AI detection with high accuracy',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/detect/undetectable/mp3',
    supportedFormats: ['mp3', 'wav','m4a','flac','ogg'] as const,
  },
  undetectabletext: {
    name: 'Undetectable AI Text',
    description: 'Advanced AI text detection with high accuracy',
    maxFileSize: 1 * 1024 * 1024, // 1MB for text files
    endpoint: '/api/detect/undetectable/text',
    supportedFormats: ['txt'] as const,
    minWords: 200,
    maxWords: 30000,
  },
  sightengineimg: {
    name: 'Sightengine Img',
    description: 'Fast and reliable AI content detection',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    endpoint: '/api/detect/sightengine',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'] as const,
  },
  sightenginemp3: {
    name: 'Sightengine mp3',
    description: 'Fast and reliable AI content detection',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    endpoint: '/api/detect/sightengine/mp3',
    supportedFormats: ['mp3', 'wav'] as const,
  },
} as const;

export class DetectionError extends Error {
  constructor(
    message: string,
    public code: number = 500,
    public details?: string
  ) {
    super(message);
    this.name = 'DetectionError';
  }
}

// Get default provider from environment or fallback to sightengine
export function getDefaultProvider(): DetectionProvider {
  const envProvider = process.env.NEXT_PUBLIC_DEFAULT_DETECTION_PROVIDER as DetectionProvider;
  return envProvider && envProvider in PROVIDER_CONFIGS ? envProvider : 'undetectableimg';
}

//调用放在client
export async function detectMusic(file: File, provider?: DetectionProvider): Promise<DetectionAudioResponse> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  // Validate file with provider-specific limits
  const validation = validateFile(file, selectedProvider);
  if (!validation.isValid) {
    throw new DetectionError(validation.error || 'Invalid file', 400);
  }

  const config = PROVIDER_CONFIGS[selectedProvider];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new DetectionError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data as DetectionAudioResponse;
  } catch (error) {
    if (error instanceof DetectionError) {
      throw error;
    }
    
    throw new DetectionError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function queryDetectionStatus(request:DetectionQueryRequest):Promise<any>{
  const response = await fetch('/api/detect/undetectable/query',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({request}),
  });

  if(!response.ok){
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function pollDetectionResult(request:DetectionQueryRequest): Promise<any>{
  const maxAttempts = 30;
  const interval = 2000;

  for(let attempt = 0; attempt < maxAttempts; attempt++){
    const status = await queryDetectionStatus(request);
    if(status.status === 'done'){
      return status;
    }
    if(status.status === 'error'){
      throw new Error('Detection failed');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Detection timeout');
}

export async function detectImage(file: File, provider?: DetectionProvider): Promise<DetectionImgResponse> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  // Validate file with provider-specific limits
  const validation = validateFile(file, selectedProvider);
  if (!validation.isValid) {
    throw new DetectionError(validation.error || 'Invalid file', 400);
  }

  const config = PROVIDER_CONFIGS[selectedProvider];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new DetectionError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data as DetectionImgResponse;
  } catch (error) {
    if (error instanceof DetectionError) {
      throw error;
    }
    
    throw new DetectionError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateFile(file: File, provider?: DetectionProvider): { isValid: boolean; error?: string } {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  const config = PROVIDER_CONFIGS[selectedProvider];
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !(config.supportedFormats as readonly string[]).includes(fileExtension)) {
    return {
      isValid: false,
      error: `Unsupported file format for ${config.name}. Supported formats: ${config.supportedFormats.join(', ')}`,
    };
  }

  // Check file size
  if (file.size < DETECTION_CONFIG.minFileSize) {
    return {
      isValid: false,
      error: 'File is too small. Minimum size is 1KB.',
    };
  }

  if (file.size > config.maxFileSize) {
    return {
      isValid: false,
      error: `File is too large for ${config.name}. Maximum size is ${formatFileSize(config.maxFileSize)}.`,
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Helper function to get confidence color
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-red-600';
  if (confidence >= 60) return 'text-orange-600';
  if (confidence >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

// Helper function to get confidence description
export function getConfidenceDescription(prediction: string, confidence: number): string {
  const level = confidence >= 80 ? 'High' : confidence >= 60 ? 'Medium' : 'Low';
  return `${level} confidence that this image is ${prediction.toLowerCase()}`;
}

// Text detection functions
export async function detectText(text: string, provider?: DetectionProvider): Promise<DetectionTextResponse> {
  const selectedProvider = provider || 'undetectabletext';
  
  // Validate text
  const validation = validateText(text);
  if (!validation.isValid) {
    throw new DetectionError(validation.error || 'Invalid text', 400);
  }

  const config = PROVIDER_CONFIGS[selectedProvider];
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new DetectionError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data as DetectionTextResponse;
  } catch (error) {
    if (error instanceof DetectionError) {
      throw error;
    }
    
    throw new DetectionError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: 'Text cannot be empty'
    };
  }

  const wordCount = countWords(text);
  const config = PROVIDER_CONFIGS.undetectabletext;

  if (wordCount > (config.maxWords || 30000)) {
    return {
      isValid: false,
      error: `Text is too long. Maximum ${config.maxWords || 30000} words allowed.`
    };
  }

  return { isValid: true };
}

export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  // 处理中英文混合文本的计数
  const trimmedText = text.trim();
  return trimmedText.length || 1; // 如果有文本但计数为0，至少返回1
}

export function validateTextState(text: string): TextInputState {
  const wordCount = countWords(text);
  const validation = validateText(text);
  
  return {
    text,
    wordCount,
    isValid: validation.isValid,
    error: validation.error || null
  };
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}