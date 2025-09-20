import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import {
  GenerateImgRequest,
  GenerateImgResponse
} from '@/types/wavespeed/nanobanana/image'
import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { UserCredits } from "@/types/user";

const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

async function generateImageWithPrompt(data: GenerateImgRequest): Promise<GenerateImgResponse> {
  const response = await fetch(`${API_BASE_URL}/google/nano-banana/text-to-image`, {
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

  const user_uuid = await getUserUuid();
  if (user_uuid){
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 2,
    });
    console.log('generate image sucess with 2 credits consuption');
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
    const { prompt } = await request.json();

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

    // Step 3: Detect image
    const generateImgRequest: GenerateImgRequest = {
      prompt: prompt
    };

    const generateImgResponse = await generateImageWithPrompt(generateImgRequest);

    return NextResponse.json(generateImgResponse);

  } catch (error) {
    console.error('Nano Banana API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 200,
          message: 'Nano Banana API error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}