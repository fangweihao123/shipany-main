import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse,
  DetectionTextRequest,
  DetectionTextResponse
} from '@/types/detect';
import { decreaseCredits, CreditsTransType } from '@/services/credit';
import { getUserUuid } from '@/services/user';

const API_BASE_URL = 'https://ai-detect.undetectable.ai';
const API_KEY = process.env.UNDETECTABLE_AI_API_KEY;

if (!API_KEY) {
  console.error('UNDETECTABLE_AI_API_KEY is not set in environment variables');
}

async function detectText(data: DetectionTextRequest): Promise<DetectionTextResponse> {
  const response = await fetch(`${API_BASE_URL}/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to detect text: ${errorData.message || response.statusText}`);
  }

  const user_uuid = await getUserUuid();
  if (user_uuid) {
    // Calculate credits based on word count (0.1 credits per word)
    const wordCount = data.text.trim().split(/\s+/).length;
    const credits = Math.ceil(wordCount * 0.01);

    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits,
    });
  }

  return response.json();
}

function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
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
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'No text provided or invalid text format',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate text length
    const wordCount = countWords(text);
    if (wordCount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Text cannot be empty',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    if (wordCount > 30000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Text is too long',
            details: 'Maximum 30,000 words allowed',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Prepare detection request
    const detectionData: DetectionTextRequest = {
      text: text.trim(),
      key: API_KEY,
      model: 'xlm_ud_detector', // Using the recommended model from the API docs
      retry_count: 1
    };

    const detectionResponse = await detectText(detectionData);

    return NextResponse.json(detectionResponse);

  } catch (error) {
    console.error('Text Detection API error:', error);
    
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