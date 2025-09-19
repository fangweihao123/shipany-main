import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';

import {
  UnwatermarkImgRequest,
  UnwatermarkVideoRequest,
  UnwatermarkImgResponse,
  UnwatermarkProvider
} from '@/types/unwatermark'
import { newStorage, Storage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';

const API_BASE_URL = process.env.WAVESPEED_API_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function uploadFile(file: Uint8Array<ArrayBufferLike>, filename:string, contentType: string): Promise<string> {
  const storage = newStorage();
  const key = `upload/${getUuid()}${filename}`;
  const response = await storage.uploadFile({
    body: file,
    key: key,
    contentType: contentType
  });
  let url = response.url;
  const firstSlashIndex = url.indexOf(key);
  if(firstSlashIndex){
    url = url.substring(firstSlashIndex - 1);
    url = STORAGE_PUBLIC_URL + url;
  }
  return url;
}

async function removeImageWaterMark(data: UnwatermarkImgRequest, provider: UnwatermarkProvider): Promise<UnwatermarkImgResponse> {
  let url = API_BASE_URL || "";
  if(provider === 'wavespeedunwatermarkimg'){
    url += '/image-watermark-remover';
  }else if(provider === 'wavespeedremovebg'){
    url += '/image-background-remover';
  }else if(provider === 'wavespeedunwatermarkvideo'){
    url += '/video-watermark-remover';
  }
  
  const response = await fetch(url, {
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

async function removeVideoWaterMark(data: UnwatermarkVideoRequest, provider: UnwatermarkProvider): Promise<UnwatermarkImgResponse> {
  let url = API_BASE_URL || "";
  url += '/video-watermark-remover';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to process video: ${response.statusText}`);
  }
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
    const provider = formData.get('provider') as UnwatermarkProvider;

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
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/avif', 'image/bmp', 'image/tiff', 'video/mp4'];
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
    if (file.size < 1024 || file.size > 100 * 1024 * 1024) {
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

    // Step 2: Upload image
    const fileBuffer = await file.bytes();
    const uploadUrl = await Promise.resolve(uploadFile(fileBuffer, file.name, file.type));

    // Step 3: Detect image
    if(provider === "wavespeedremovebg" || provider === "wavespeedunwatermarkimg"){
      const removeRequest: UnwatermarkImgRequest = {
        image: uploadUrl
      };

      const detectionResponse = await removeImageWaterMark(removeRequest, provider);

      return NextResponse.json(detectionResponse);
    }else{
      const removeRequest: UnwatermarkVideoRequest = {
        video: uploadUrl
      };
      const detectionResponse = await removeVideoWaterMark(removeRequest, provider);

      return NextResponse.json(detectionResponse);
    }

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