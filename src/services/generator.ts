import {
  ApiErrorResponse,
  TextInputState
} from '@/types/detect';
import { R2PresignedUrlRequest, R2PresignedUrlResponse, uploadToR2 } from '@/lib/utils';

import { GeneratorProvider } from '@/types/generator';
import { getFingerPrint } from '@/lib/localstorage/webfingerprint';

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
  },
  nanobananai2v: {
    name: 'Nano Banana',
    description: 'Advanced Video Generator Engine',
    model: "veo3-fast",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/wavespeed/nano-banana/image2video',
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

export async function generateImage(prompt: string, provider?: GeneratorProvider, isRetry: boolean = false, output_format: string = 'png'): Promise<string> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  const config = PROVIDER_CONFIGS[selectedProvider];
  try {
    const fingerPrint: string = await getFingerPrint();
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'serial-code' : fingerPrint 
      },
      body: JSON.stringify( {
        "prompt": prompt,
        "isRetry": isRetry,
        "output_format": output_format
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

export async function UploadFiles(files: File[], provider?: GeneratorProvider): Promise<string[]> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  files.forEach(file => {
    const validation = validateFile(file, selectedProvider);
    if (!validation.isValid) {
      throw new GeneratorError(validation.error || 'Invalid file', 400);
    }
  });
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
  return filesUrl;
}

export async function editImage(filesUrl: string[], prompt: string, provider?: GeneratorProvider, isRetry: boolean = false, output_format: string = 'png'): Promise<string> {
  const defaultProvider = getDefaultProvider();
  const selectedProvider = provider || defaultProvider;
  // Validate file with provider-specific limits
  const config = PROVIDER_CONFIGS[selectedProvider];
  try {
    const fingerPrint: string = await getFingerPrint();
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'serial-code' : fingerPrint 
      },
      body: JSON.stringify({
        "prompt": prompt,
        "uploadUrls": filesUrl,
        "isRetry": isRetry,
        "output_format": output_format
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


export async function generateVideo(
  imageUrl: string, 
  prompt: string, 
  provider?: GeneratorProvider, 
  isRetry: boolean = false,
  options?: {
    aspect_ratio?: "16:9" | "9:16";
    duration?: number;
    resolution?: "720p" | "1080p";
    generate_audio?: boolean;
    negative_prompt?: string;
    seed?: number;
  }
): Promise<string> {
  const defaultProvider = 'nanobananai2v' as GeneratorProvider;
  const selectedProvider = provider || defaultProvider;
  const config = PROVIDER_CONFIGS[selectedProvider];
  
  try {
    const fingerPrint: string = await getFingerPrint();
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'serial-code' : fingerPrint 
      },
      body: JSON.stringify({
        prompt: prompt,
        imageUrl: imageUrl,
        isRetry: isRetry,
        ...options
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
    return data.data.id || data.data.taskId;
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

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}