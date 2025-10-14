import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserInfo, getUserUuid } from '@/services/user';
import { GenerateVideoRequest, GenerateVideoResponse } from '@/types/kieai/sora2/video';
import { HasEnoughCredits } from '@/services/credits/credit.lib';
import { ErrorCode, TaskCreditsConsumption } from '@/services/constant';
import { GeneratorProvider } from '@/types/generator';
import { TaskProvider } from '@/types/task';
import { getClientIp, getSerialCode } from '@/lib/ip';
import { canUseTrialService, increaseTaskTrialUsage } from '@/services/trialtask';

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

  const user_uuid = await getUserUuid();
  if (user_uuid && !isRetry){
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 10, // Video generation costs more credits
    });
    console.log('generate video success with 50 credits consumption');
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
    const generatorModel : GeneratorProvider = "sora2i2v";
    const task_code : TaskProvider = "GenerateVideo";
    const taskCreditsConsuption: number = TaskCreditsConsumption[generatorModel];
    const ip: string = await getClientIp();
    const fingerPrint = await getSerialCode();
    if(user_uuid){
      if(!await HasEnoughCredits(user_uuid, taskCreditsConsuption)){
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.InSufficientCredits,
              message: 'InSufficient Credits',
            },
          } as ApiErrorResponse,
          { status: 500 }
        );
      }
    }else if(!await canUseTrialService({fingerPrint, ip, task_code})){
      return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.RunOutTrial,
              message: 'Run out of Free Trial',
            },
          } as ApiErrorResponse,
          { status: 500 }
        );
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
    
    if(!isRetry){
      if (user_uuid){
        await decreaseCredits({
          user_uuid,
          trans_type: CreditsTransType.Ping,
          credits: taskCreditsConsuption, // Video generation costs more credits
        });
        console.log(`Generate video success with ${taskCreditsConsuption} credits consumption`);
      }else{
        increaseTaskTrialUsage({fingerPrint, ip, task_code, times:1});
        console.log(`Device ${fingerPrint} ip ${ip} generate video success with free trial`);
      }
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