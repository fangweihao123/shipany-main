import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
} from '@/types/detect';

import {
  GenerateVideoRequest,
  GenerateVideoResponse
} from '@/types/wavespeed/nanobanana/video'
import { decreaseCredits, CreditsTransType, getUserCredits } from '@/services/credit';
import { getUserUuid } from '@/services/user';
import { UserCredits } from "@/types/user";

const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;
const STORAGE_ENDPOINT_BUCKET = process.env.STORAGE_ENDPOINT + '/' + process.env.STORAGE_BUCKET;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

async function generateVideoWithImage(data: GenerateVideoRequest, isRetry: boolean = false): Promise<GenerateVideoResponse> {
  const response = await fetch(`${API_BASE_URL}/google/veo3-fast/image-to-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate video: ${response.statusText}`);
  }

  const user_uuid = await getUserUuid();
  if (user_uuid && !isRetry){
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: 5, // Video generation costs more credits
    });
    console.log('generate video success with 5 credits consumption');
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
      imageUrl, 
      isRetry, 
      aspect_ratio = '16:9', 
      duration = 8, 
      resolution = '720p', 
      generate_audio = false,
      negative_prompt,
      seed
    } = await request.json();

    const user_uuid = await getUserUuid();
    if(user_uuid.length > 0){
      const usercredits : UserCredits = await getUserCredits(user_uuid);
      if(usercredits.left_credits < 5){
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

    // Convert storage URL if needed
    let processedImageUrl = imageUrl;
    if(STORAGE_ENDPOINT_BUCKET && STORAGE_PUBLIC_URL){
      processedImageUrl = imageUrl.replace(STORAGE_ENDPOINT_BUCKET, STORAGE_PUBLIC_URL);
    }

    // Generate video
    const generateVideoRequest: GenerateVideoRequest = {
      prompt: prompt,
      image: processedImageUrl,
      aspect_ratio: aspect_ratio,
      duration: duration,
      resolution: resolution,
      generate_audio: generate_audio,
      ...(negative_prompt && { negative_prompt }),
      ...(seed && { seed })
    };

    const generateVideoResponse = await generateVideoWithImage(generateVideoRequest, isRetry);

    return NextResponse.json(generateVideoResponse);

  } catch (error) {
    console.error('Nano Banana Video API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 200,
          message: 'Nano Banana Video API error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}