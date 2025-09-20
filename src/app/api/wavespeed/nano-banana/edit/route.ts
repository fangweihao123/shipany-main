import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import {
  UnwatermarkImgResponse
} from '@/types/unwatermark'
import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { newStorage, Storage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { EditImgRequest } from '@/types/wavespeed/nanobanana/image';
import { UserCredits } from "@/types/user";

const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function uploadImage(file: Uint8Array<ArrayBufferLike>, contentType: string): Promise<string> {
  const storage = newStorage();
  const key = `upload/img_${getUuid()}.png`;
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

async function EditImage(data: EditImgRequest): Promise<UnwatermarkImgResponse> {
  const response = await fetch(`${API_BASE_URL}/google/nano-banana/edit`, {
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
  if (user_uuid){
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 2,
    });
    console.log('edit image sucess with 2 credits consuption');
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

    const user_uuid = await getUserUuid();
    const usercredits : UserCredits = await getUserCredits(user_uuid);
    if(usercredits.left_credits < 2){
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 100,
            message: 'InSufficient Credits',
          },
        } as ApiErrorResponse,
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const files = formData.getAll('file') as File[];

    if (files.length === 0) {
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
    const uploadUrls = await Promise.all(
      files.map(async (file) => {
        const fileBuffer = await file.bytes();
        return uploadImage(fileBuffer, file.type);
      })
    );

    // Step 3: Detect image
    const editRequest: EditImgRequest = {
      prompt: prompt,
      images : uploadUrls
    };

    const Response = await EditImage(editRequest);

    return NextResponse.json(Response);

  } catch (error) {
    console.error('NanoBanana API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 200,
          message: 'NanoBanana API error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}