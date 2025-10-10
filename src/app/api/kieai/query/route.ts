import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse
} from '@/types/detect';

const API_BASE_URL = process.env.KIEAI_API_BASE_ENDPOINT || "https://api.kie.ai/api/v1";
const API_KEY = process.env.KIEAI_API_KEY;

if (!API_KEY) {
  console.error('KIEAI_API_KEY is not set in environment variables');
}

async function queryTaskStatus(id: string): Promise<string> {
  const url: string = `${API_BASE_URL}/jobs/recordInfo?taskId=${id}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch task ${id} status: ${response.statusText}`);
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
    const {id} = await request.json();

    const queryStatusResponse = await queryTaskStatus(id);
    
    return NextResponse.json(queryStatusResponse);

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