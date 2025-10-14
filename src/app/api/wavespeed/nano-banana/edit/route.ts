import {
  EditImgRequest,
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
import { UnwatermarkImgResponse } from '@/types/unwatermark';


const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_ENDPOINT_BUCKET = process.env.STORAGE_ENDPOINT + '/' + process.env.STORAGE_BUCKET;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function EditImage(data: EditImgRequest, isRetry: boolean = false): Promise<UnwatermarkImgResponse> {
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
    const generatorModel : GeneratorProvider = "nanobananai2i";
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

    let { prompt, uploadUrls, isRetry, output_format = 'png' } = await request.json();

    if (uploadUrls.length === 0) {
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
    
    uploadUrls = uploadUrls.map((uploadUrl: string) => {
      if(STORAGE_ENDPOINT_BUCKET && STORAGE_PUBLIC_URL){
        return uploadUrl.replace(STORAGE_ENDPOINT_BUCKET, STORAGE_PUBLIC_URL);
      }
      return uploadUrl;
    });

    // Step 3: Edit image
    const editRequest: EditImgRequest = {
      prompt: prompt,
      images : uploadUrls,
      output_format: output_format
    };

    const Response = await EditImage(editRequest, isRetry);
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