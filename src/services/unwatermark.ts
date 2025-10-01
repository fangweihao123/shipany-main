import { uploadFileToR2 } from '@/lib/utils';
import {
  ApiErrorResponse,
  TextInputState
} from '@/types/detect';

import {
  UnwatermarkProvider
} from '@/types/unwatermark'

export const PROVIDER_CONFIGS = {
  wavespeedunwatermarkimg: {
    name: 'Unwatermark Image',
    description: 'Remove Watermark From Image',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/watermark/wavespeed',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'],
    fileScope: "image/*"
  },
  wavespeedremovebg:{
    name: 'Unwatermark Image',
    description: 'Remove Watermark From Image',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/watermark/wavespeed',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'],
    fileScope: "image/*"
  },
  wavespeedunwatermarkvideo:{
    name: 'Unwatermark Video',
    description: 'Remove Watermark From Video',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    endpoint: '/api/watermark/wavespeed',
    supportedFormats: ['mp4'],
    fileScope: "video/*"
  }
} as const;

export class UnwatermarkError extends Error {
  constructor(
    message: string,
    public code: number = 500,
    public details?: string
  ) {
    super(message);
    this.name = 'Unwatermark/Error';
  }
}

// Get default provider from environment or fallback to sightengine
export function getDefaultProvider(): UnwatermarkProvider {
  const envProvider = process.env.NEXT_PUBLIC_DEFAULT_DETECTION_PROVIDER as UnwatermarkProvider;
  return envProvider && envProvider in PROVIDER_CONFIGS ? envProvider : 'wavespeedunwatermarkimg';
}

export async function unwatermarkImage(file: File, provider?: UnwatermarkProvider): Promise<string> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  // Validate file with provider-specific limits
  const validation = validateFile(file, selectedProvider);
  if (!validation.isValid) {
    throw new UnwatermarkError(validation.error || 'Invalid file', 400);
  }
  const config = PROVIDER_CONFIGS[selectedProvider];
  const {publicUrl, key} = await uploadFileToR2(file);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        fileUrl: publicUrl,
        provider: selectedProvider,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new UnwatermarkError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data.data.id;
  } catch (error) {
    if (error instanceof UnwatermarkError) {
      throw error;
    }
    
    throw new UnwatermarkError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateFile(file: File, provider?: UnwatermarkProvider): { isValid: boolean; error?: string } {
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

  if (file.size > config.maxFileSize) {
    return {
      isValid: false,
      error: `File is too large for ${config.name}. Maximum size is ${formatFileSize(config.maxFileSize)}.`,
    };
  }

  return { isValid: true };
}


export async function queryTaskStatus(id:string):Promise<any>{
  const response = await fetch('/api/watermark/wavespeed/query',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id}),
  });
  if(!response.ok){
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("query result", result);
  return result;
}

export async function pollTaskResult(id: string): Promise<any>{
  const maxAttempts = 60;
  const interval = 2000;

  for(let attempt = 0; attempt < maxAttempts; attempt++){
    const status = await queryTaskStatus(id);
    if(status.data.status === 'completed'){
      return status;
    }
    if(status.data.status === 'failed'){
      throw new Error('unwatermark failed');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Detection timeout');
}

export function getSupportFileType(provider: UnwatermarkProvider): [readonly string[], string]{
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  const config = PROVIDER_CONFIGS[selectedProvider];
  return [config.supportedFormats, config.fileScope]
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
