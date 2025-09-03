import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
  DetectionQueryRequest,
  DetectionAudioQueryResponse
} from '@/types/detect';

const API_BASE_URL = 'https://ai-audio-detect.undetectable.ai';
const API_KEY = process.env.UNDETECTABLE_AI_API_KEY;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function queryTaskStatus(data: DetectionQueryRequest): Promise<DetectionAudioQueryResponse> {
  const url: string = `https://ai-${data.type}-detect.undetectable.ai/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': `application/json`,
    },
    body: JSON.stringify({ id: data.id }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch task ${data.id} status: ${response.statusText}`);
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

    const body = await request.json();
    const queryRequest : DetectionQueryRequest = body.request;

    const queryStatusResponse = await queryTaskStatus(queryRequest);
    
    return NextResponse.json(queryStatusResponse);

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