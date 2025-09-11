import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse
} from '@/types/detect';

const API_BASE_URL = process.env.WAVESPEED_API_QUERY_ENDPOINT || "";
const API_KEY = process.env.WAVESPEED_API_KEY;

if (!API_KEY) {
  console.error('ERASE_WATERMARK_API_KEY is not set in environment variables');
}

async function queryTaskStatus(id: string): Promise<string> {
  const url: string = API_BASE_URL.replace("{requestId}", id);
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

    const body = await request.json();
    const id : string = body.id;

    const queryStatusResponse = await queryTaskStatus(id);
    
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