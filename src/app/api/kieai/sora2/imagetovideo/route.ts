import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { newStorage, Storage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { GenerateVideoRequest, GenerateVideoResponse } from '@/types/kieai/sora2/video';
import { UserCredits } from '@/types/user';

const API_BASE_URL = process.env.KIEAI_API_BASE_ENDPOINT;
const API_KEY = process.env.KIEAI_API_KEY;
const STORAGE_ENDPOINT_BUCKET = process.env.STORAGE_ENDPOINT + '/' + process.env.STORAGE_BUCKET;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

async function generateVideoWithImage(data: GenerateVideoRequest, isRetry:boolean=false): Promise<GenerateVideoResponse> {
  const response = await fetch(`${API_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
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
    const { 
      prompt, 
      model,
      imageUrls, 
      isRetry, 
      ratio = '16:9', 
      duration = 8, 
      resolution = '720p', 
      generate_audio = false,
      negative_prompt,
      seed
    } = await request.json();

    const user_uuid = await getUserUuid();
    if(user_uuid.length > 0){
      const usercredits : UserCredits = await getUserCredits(user_uuid);
      if(usercredits.left_credits < 50){
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
    }

    const processedImageUrls = (imageUrls ?? []).map((url: string) => {
    if (STORAGE_ENDPOINT_BUCKET && STORAGE_PUBLIC_URL) {
      return url.replace(STORAGE_ENDPOINT_BUCKET, STORAGE_PUBLIC_URL);
    }
    return url;
  });

    const aspect_ratio = ratio === "16:9" ? "landscape" : "portrait";
    // Step 3: Detect image
    const generateVideoRequest: GenerateVideoRequest = {
      model : model,
      input : {
        prompt: prompt,
        image_urls: processedImageUrls,
        aspect_ratio: aspect_ratio
      }
    };

    const generateVideoResponse = await generateVideoWithImage(generateVideoRequest);

    return NextResponse.json(generateVideoResponse);

  } catch (error) {
    console.error('Sora2 API error:', error);
    
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