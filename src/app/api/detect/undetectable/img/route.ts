import { NextRequest, NextResponse } from 'next/server';
import {
  PreSignedUrlRequest,
  PreSignedUrlResponse,
  ApiErrorResponse,
  DetectionImgRequest,
  DetectionImgResponse
} from '@/types/detect';
import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';

const API_BASE_URL = 'https://ai-image-detect.undetectable.ai';
const API_KEY = process.env.UNDETECTABLE_AI_API_KEY;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}


async function getPreSignedUrl(data: PreSignedUrlRequest): Promise<PreSignedUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/get-presigned-url?file_name=${data.file_name}`, {
    method: 'GET',
    headers: {
      'apikey': `${API_KEY}`,
    },
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
      'Content-Type': `${contentType}`,
      'x-amz-acl': 'private'
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`${response.status} Failed to upload image: ${response.statusText}}`);
  }
}

async function detectImage(data: DetectionImgRequest): Promise<DetectionImgResponse> {
  const response = await fetch(`${API_BASE_URL}/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': `application/json`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to detect image: ${response.statusText}`);
  }
  const user_uuid = await getUserUuid();
  if (!user_uuid){
    throw new Error("Please Login First");
  }
  await decreaseCredits({
    user_uuid,
    trans_type: CreditsTransType.Ping,
    credits: 1,
  });
  return response.json();
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

    if (presignedResponse.status !== "success") {
      throw new Error('Failed to get presigned URL');
    }

    // Step 2: Upload image
    const fileBuffer = await file.arrayBuffer();
    await uploadImage(presignedResponse.presigned_url, fileBuffer, file.type);

    // Step 3: Detect image
    const detectionData: DetectionImgRequest = {
      key: API_KEY,
      url: `https://ai-image-detector-prod.nyc3.digitaloceanspaces.com/${presignedResponse.file_path}`,
      generate_preview: false
    };

    const detectionResponse = await detectImage(detectionData);
    

    return NextResponse.json(detectionResponse);

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