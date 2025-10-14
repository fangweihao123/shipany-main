import {
  GenerateImgRequest,
  GenerateImgResponse
} from '@/types/wavespeed/nanobanana/image'
import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';
import { getUserInfo, getUserUuid } from '@/services/user';
import { HasEnoughCredits } from '@/services/credits/credit.lib';
import { ErrorCode, TaskCreditsConsumption } from '@/services/constant';
import { GeneratorProvider } from '@/types/generator';
import { TaskProvider } from '@/types/task';
import { getClientIp, getSerialCode } from '@/lib/ip';
import { canUseTrialService, increaseTaskTrialUsage } from '@/services/trialtask';
import { CreditsTransType, decreaseCredits } from '@/services/credit';

const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

async function generateImageWithPrompt(data: GenerateImgRequest, isRetry: boolean = false): Promise<GenerateImgResponse> {
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
    const { prompt, isRetry, output_format = 'png' } = await request.json();

    const user_uuid = await getUserUuid();
    const generatorModel : GeneratorProvider = "nanobananat2i";
    const task_code : TaskProvider = "GenerateImage";
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

    // Step 3: Generate image
    const generateImgRequest: GenerateImgRequest = {
      prompt: prompt,
      output_format: output_format
    };

    const generateImgResponse = await generateImageWithPrompt(generateImgRequest, isRetry);

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