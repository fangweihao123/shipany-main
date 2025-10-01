import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserUuid } from '@/services/user';

import {
  UnwatermarkImgRequest,
  UnwatermarkVideoRequest,
  UnwatermarkImgResponse,
  UnwatermarkProvider
} from '@/types/unwatermark'
import { newStorage, Storage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { UserCredits } from '@/types/user';

const API_BASE_URL = process.env.WAVESPEED_API_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;
const STORAGE_ENDPOINT_BUCKET = process.env.STORAGE_ENDPOINT + '/' + process.env.STORAGE_BUCKET;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
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
  if (user_uuid){
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 1,
    });
  }

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

    let {fileUrl, provider} = await request.json();
    let isCreditsSufficient = true;
    const user_uuid = await getUserUuid();
    if(user_uuid.length > 0){
      const usercredits : UserCredits = await getUserCredits(user_uuid);
      if(provider === "wavespeedremovebg" || provider === "wavespeedunwatermarkimg"){
        if(usercredits.left_credits < 1){
          isCreditsSufficient = false;
        }
      }else{
        if(usercredits.left_credits < 10){
          isCreditsSufficient = false;
        }
      }
    }

    if(!isCreditsSufficient){
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

    if(STORAGE_ENDPOINT_BUCKET && STORAGE_PUBLIC_URL){
      fileUrl = fileUrl.replace(STORAGE_ENDPOINT_BUCKET, STORAGE_PUBLIC_URL);
    }

    // Step 3: Detect image
    if(provider === "wavespeedremovebg" || provider === "wavespeedunwatermarkimg"){
      const removeRequest: UnwatermarkImgRequest = {
        image: fileUrl
      };

      const detectionResponse = await removeImageWaterMark(removeRequest, provider);

      return NextResponse.json(detectionResponse);
    }else{
      const removeRequest: UnwatermarkVideoRequest = {
        video: fileUrl
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