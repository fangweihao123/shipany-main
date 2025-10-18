import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { GenerateVideoRequest, GenerateVideoResponse } from '@/types/kieai/sora2/video';
import { HasEnoughCredits } from '@/services/credits/credit.lib';
import { ErrorCode, TaskCreditsConsumption } from '@/services/constant';

const API_BASE_URL = process.env.KIEAI_API_BASE_ENDPOINT;
const API_KEY = process.env.KIEAI_API_KEY;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

async function generateVideoWithPrompt(data: GenerateVideoRequest, isRetry:boolean=false): Promise<GenerateVideoResponse> {
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
      aspect_ratio = 'landscape',
      n_frames = 10,
      remove_watermark = true,
    } = await request.json();
    const user_uuid = await getUserUuid();
    if(!user_uuid){
      return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.Unauthorized,
              message: 'Please sign in to continue',
            },
          } as ApiErrorResponse,
          { status: 401 }
        );
    }

    const taskCreditsConsumption: number = TaskCreditsConsumption.sora2t2v;
    if(!await HasEnoughCredits(user_uuid, taskCreditsConsumption)){
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.InSufficientCredits,
            message: 'InSufficient Credits',
          },
        } as ApiErrorResponse,
        { status: 402 }
      );
    }
    
    const frameCount = typeof n_frames === 'number' ? n_frames : Number(n_frames ?? 10);
    const generateVideoRequest: GenerateVideoRequest = {
      model : model,
      input : {
        prompt: prompt,
        aspect_ratio: aspect_ratio,
        n_frames: Number.isFinite(frameCount) ? frameCount : 10,
        remove_watermark: Boolean(remove_watermark),
      }
    };

    const generateVideoResponse = await generateVideoWithPrompt(generateVideoRequest, false);

    if(!isRetry){
      await decreaseCredits({
        user_uuid,
        trans_type: CreditsTransType.Ping,
        credits: taskCreditsConsumption, // Video generation costs more credits
      });
      console.log(`Generate video success with ${taskCreditsConsumption} credits consumption`);
    }

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
