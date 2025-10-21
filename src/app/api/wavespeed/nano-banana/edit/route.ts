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
import { logGenerationTask } from '@/services/generation-task';

import {
  UnwatermarkImgResponse
} from '@/types/unwatermark'
import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { newStorage, Storage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { EditImgRequest } from '@/types/wavespeed/nanobanana/image';

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

    const Response = await EditImage(editRequest, isRetry);
    const responsePayload = Response as unknown as Record<string, any>;
    const taskId =
      responsePayload?.data?.id ||
      responsePayload?.data?.taskId ||
      responsePayload?.id ||
      responsePayload?.taskId ||
      responsePayload?.requestId;

    if (taskId && user_uuid) {
      await logGenerationTask({
        taskId,
        prompt,
        mode: "i2i",
        userUuid: user_uuid,
        metadata: {
          output_format,
          provider: generatorModel,
          isRetry: Boolean(isRetry),
          uploads: uploadUrls,
        },
      });
    }
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
