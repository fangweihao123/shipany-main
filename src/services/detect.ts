import {
  DetectionResponse,
  UnifiedDetectionResponse,
  ApiErrorResponse,
  UserCreditsResponse,
  ImageDetectionConfig,
  SupportedImageFormat,
  DetectionProvider
} from '@/types/detect';

export const DETECTION_CONFIG: ImageDetectionConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 1024, // 1KB
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'],
  apiBaseUrl: '/api/detect',
};

export const PROVIDER_CONFIGS = {
  undetectable: {
    name: 'Undetectable AI',
    description: 'Advanced AI detection with high accuracy',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    endpoint: '/api/detect',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif', 'bmp', 'tiff'] as const,
  },
  sightengine: {
    name: 'Sightengine',
    description: 'Fast and reliable AI content detection',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    endpoint: '/api/detect/sightengine',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'] as const,
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
  return envProvider && envProvider in PROVIDER_CONFIGS ? envProvider : 'sightengine';
}

export async function detectImage(file: File, provider?: DetectionProvider): Promise<UnifiedDetectionResponse> {
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

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new DetectionError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details
      );
    }

    return data as UnifiedDetectionResponse;
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