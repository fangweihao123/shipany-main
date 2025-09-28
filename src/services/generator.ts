import {
  ApiErrorResponse,
  TextInputState
} from '@/types/detect';
import { R2PresignedUrlRequest, R2PresignedUrlResponse, uploadToR2 } from '@/lib/utils';

import { GeneratorProvider } from '@/types/generator';

export const PROVIDER_CONFIGS = {
  nanobananat2i: {
    name: 'Nano Banana',
    description: 'Advanced Image Generator Engine',
    model: "gemini-2.5-flash-image-preview",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/wavespeed/nano-banana/texttoimage',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff']  
  },
  nanobananai2i: {
    name: 'Nano Banana',
    description: 'Advanced Image Generator Engine',
    model: "gemini-2.5-flash-image-preview",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/wavespeed/nano-banana/edit',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff']  
  }
} as const;

export class GeneratorError extends Error {
  constructor(
    message: string,
    public code: number = 500,
    public details?: string
  ) {
    super(message);
    this.name = 'Generator/Error';
  }
}

// Get default provider from environment or fallback to sightengine
export function getDefaultProvider(): GeneratorProvider {
  const envProvider = process.env.NEXT_PUBLIC_DEFAULT_DETECTION_PROVIDER as GeneratorProvider;
  return envProvider && envProvider in PROVIDER_CONFIGS ? envProvider : 'nanobananat2i';
}

export async function generateImage(prompt: string, provider?: GeneratorProvider): Promise<string> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  const config = PROVIDER_CONFIGS[selectedProvider];
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( {
        "prompt": prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new GeneratorError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data.data.id;
  } catch (error) {
    if (error instanceof GeneratorError) {
      throw error;
    }
    
    throw new GeneratorError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function editImage(files: File[], prompt: string, provider?: GeneratorProvider): Promise<string> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  // Validate file with provider-specific limits
  files.forEach(file => {
    const validation = validateFile(file, selectedProvider);
    if (!validation.isValid) {
      throw new GeneratorError(validation.error || 'Invalid file', 400);
    }
  });

  const config = PROVIDER_CONFIGS[selectedProvider];

  const filesUrl = await Promise.all(
    files.map(async (file) => {
      const request : R2PresignedUrlRequest = {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size
      }; 
      const response = await 
      fetch("/api/upload/presigned-url", {
        method: "POST",
        body: JSON.stringify(request)
      });
      const data = await response.json();
      if(data.success){
        await uploadToR2(file, data);
        return data.publicUrl;
      }
    })
  );

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        "prompt": prompt,
        "uploadUrls": filesUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      throw new GeneratorError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data.data.id;
  } catch (error) {
    if (error instanceof GeneratorError) {
      throw error;
    }
    
    throw new GeneratorError(
      'Network error occurred',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export function validateFile(file: File, provider?: GeneratorProvider): { isValid: boolean; error?: string } {
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
  const maxAttempts = 30;
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


export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}