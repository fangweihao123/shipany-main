import { NextRequest, NextResponse } from 'next/server';
import {
  SightengineDetectionResponse,
  ApiErrorResponse
} from '@/types/detect';
import { R2DetectionRequest } from '@/lib/utils';
import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';

const API_BASE_URL = 'https://api.sightengine.com/1.0/check.json';
const API_USER = process.env.SIGHTENGINE_API_USER;
const API_SECRET = process.env.SIGHTENGINE_API_SECRET;

const STORAGE_ENDPOINT_BUCKET = process.env.STORAGE_ENDPOINT + "/" + process.env.STORAGE_BUCKET;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;


if (!API_USER || !API_SECRET) {
  console.error('SIGHTENGINE_API_USER or SIGHTENGINE_API_SECRET is not set in environment variables');
}

async function detectImageWithSightengine(file: File): Promise<SightengineDetectionResponse> {
  const formData = new FormData();
  formData.append('media', file);
  formData.append('models', 'genai');
  formData.append('api_user', API_USER!);
  formData.append('api_secret', API_SECRET!);

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sightengine API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(`Sightengine API failed: ${JSON.stringify(data)}`);
  }

  return data as SightengineDetectionResponse;
}

async function detectImageFromUrl(imageUrl: string): Promise<SightengineDetectionResponse> {
  const formData = new FormData();
  if (STORAGE_ENDPOINT_BUCKET && STORAGE_PUBLIC_URL) 
  {
    imageUrl = imageUrl.replace(STORAGE_ENDPOINT_BUCKET, STORAGE_PUBLIC_URL);
  }
  formData.append('url', imageUrl);
  formData.append('models', 'genai');
  formData.append('api_user', API_USER!);
  formData.append('api_secret', API_SECRET!);

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sightengine API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(`Sightengine API failed: ${JSON.stringify(data)}`);
  }

  return data as SightengineDetectionResponse;
}

function transformSightengineResponse(
  sightengineResponse: SightengineDetectionResponse
): any {
  const aiScore = sightengineResponse.type.ai_generated;
  
  // Sightengine returns a score from 0 to 1, where higher values indicate AI-generated content
  // Convert to percentage and determine prediction
  const confidence = Math.round(aiScore * 100);
  const isAIGenerated = aiScore > 0.5; // Threshold: 50%
  
  // Transform to match the expected frontend structure
  return {
    result: isAIGenerated ? confidence : 100 - confidence, // confidence score as number
    result_details: {
      final_result: isAIGenerated ? "AI Generated" : "Not AI Generated"
    },
    success: true,
    provider: 'sightengineimg',
    confidence_percentage: `${isAIGenerated ? confidence : 100 - confidence}%`,
    raw_score: aiScore,
    request_id: sightengineResponse.request.id,
    image_url: sightengineResponse.media.uri,
    processing_time: Date.now() / 1000 - sightengineResponse.request.timestamp,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!API_USER || !API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            message: 'Sightengine API credentials not configured',
          },
        } as ApiErrorResponse,
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type');
    let sightengineResponse: SightengineDetectionResponse;

    // Check if request contains JSON (R2 URL detection) or FormData (direct file upload)
    if (contentType?.includes('application/json')) {
      // Handle R2 URL detection
      const body: R2DetectionRequest = await request.json();
      const { fileUrl, filename, contentType: fileContentType } = body;

      if (!fileUrl || !filename || !fileContentType) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 400,
              message: 'Missing required fields: fileUrl, filename, contentType',
            },
          } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Validate content type
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
      if (!supportedTypes.includes(fileContentType)) {
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

      // Detect image from R2 URL
      sightengineResponse = await detectImageFromUrl(fileUrl);
      
    } else {
      // Handle direct file upload (legacy support)
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
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
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

      // Validate file size (1KB - 50MB for Sightengine)
      if (file.size < 1024 || file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 400,
              message: 'Invalid file size',
              details: 'File size must be between 1KB and 50MB for Sightengine',
            },
          } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Detect image using direct file upload
      sightengineResponse = await detectImageWithSightengine(file);
    }
    
    // Decrease credits after successful detection
    const user_uuid = await getUserUuid();
    if (user_uuid) {
      await decreaseCredits({
        user_uuid,
        trans_type: CreditsTransType.Ping,
        credits: 4,
      });
    }

    // Transform response to unified format
    const unifiedResponse = transformSightengineResponse(sightengineResponse);

    return NextResponse.json(unifiedResponse);

  } catch (error) {
    console.error('Sightengine detection error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Sightengine detection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}