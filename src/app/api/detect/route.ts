import { NextRequest, NextResponse } from 'next/server';
import {
  PreSignedUrlRequest,
  PreSignedUrlResponse,
  DetectionRequest,
  DetectionResponse,
  UnifiedDetectionResponse,
  ApiErrorResponse
} from '@/types/detect';

const API_BASE_URL = 'https://ai-image-detect.undetectable.ai';
const API_KEY = process.env.UNDETECTABLE_AI_API_KEY;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function getPreSignedUrl(data: PreSignedUrlRequest): Promise<PreSignedUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/get-presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  return response.json();
}

async function uploadImage(presignedUrl: string, file: ArrayBuffer, contentType: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }
}

async function detectImage(data: DetectionRequest): Promise<DetectionResponse> {
  const response = await fetch(`${API_BASE_URL}/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to detect image: ${response.statusText}`);
  }

  return response.json();
}

function transformUndetectableResponse(
  undetectableResponse: DetectionResponse
): UnifiedDetectionResponse {
  return {
    success: undetectableResponse.success,
    provider: 'undetectable',
    result: undetectableResponse.result,
    upload_id: undetectableResponse.upload_id,
    image_url: undetectableResponse.image_url,
    preview_url: undetectableResponse.preview_url,
    processing_time: undetectableResponse.processing_time,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            message: 'API key not configured',
          },
        } as ApiErrorResponse,
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'No file provided',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/avif', 'image/bmp', 'image/tiff'];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Unsupported file type',
            details: `Supported types: ${supportedTypes.join(', ')}`,
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate file size (1KB - 10MB)
    if (file.size < 1024 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Invalid file size',
            details: 'File size must be between 1KB and 10MB',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Step 1: Get presigned URL
    const presignedData: PreSignedUrlRequest = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    };

    const presignedResponse = await getPreSignedUrl(presignedData);

    if (!presignedResponse.success) {
      throw new Error('Failed to get presigned URL');
    }

    // Step 2: Upload image
    const fileBuffer = await file.arrayBuffer();
    await uploadImage(presignedResponse.presigned_url, fileBuffer, file.type);

    // Step 3: Detect image
    const detectionData: DetectionRequest = {
      image_url: presignedResponse.image_url,
      generate_preview: true,
      document_type: 'image',
    };

    const detectionResponse = await detectImage(detectionData);
    
    // Transform response to unified format
    const unifiedResponse = transformUndetectableResponse(detectionResponse);

    return NextResponse.json(unifiedResponse);

  } catch (error) {
    console.error('Detection API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}