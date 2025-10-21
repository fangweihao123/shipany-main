import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse
} from '@/types/detect';
import { updateGenerationTask } from '@/services/generation-task';
import type { GenerationStatus } from '@/types/generation';

const API_BASE_URL = process.env.WAVESPEED_API_QUERY_ENDPOINT || "";
const API_KEY = process.env.WAVESPEED_API_KEY;

if (!API_KEY) {
  console.error('ERASE_WATERMARK_API_KEY is not set in environment variables');
}

async function queryTaskStatus(id: string): Promise<any> {
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

function inferStatus(payload: any): GenerationStatus | null {
  const rawStatus =
    payload?.data?.status ??
    payload?.status ??
    payload?.data?.task_status ??
    payload?.task_status;

  if (!rawStatus) {
    return null;
  }

  const normalized = String(rawStatus).toLowerCase();

  if (["completed", "finished", "succeeded", "success"].includes(normalized)) {
    return "completed";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }
  if (["processing", "running", "generating", "in_progress"].includes(normalized)) {
    return "processing";
  }
  if (["pending", "queued", "queueing"].includes(normalized)) {
    return "pending";
  }

  return null;
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

    const status = inferStatus(queryStatusResponse);

    if (status === "completed") {
      await updateGenerationTask(id, {
        status: "completed",
        metadata: {
          lastResponse: queryStatusResponse,
        },
      });
    } else if (status === "failed") {
      await updateGenerationTask(id, {
        status: "failed",
        errorMessage:
          queryStatusResponse?.data?.error?.message ||
          queryStatusResponse?.error?.message ||
          "Generation failed",
        metadata: {
          lastResponse: queryStatusResponse,
        },
      });
    }
    
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
