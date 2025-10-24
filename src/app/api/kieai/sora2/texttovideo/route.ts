import { NextRequest, NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/types/detect";
import {
  decreaseCredits,
  CreditsTransType,
  getUserCredits,
} from "@/services/credit";
import { getUserUuid } from "@/services/user";
import type {
  GenerateVideoRequest,
  GenerateVideoResponse,
} from "@/types/kieai/sora2/video";
import type { UserCredits } from "@/types/user";
import { ErrorCode } from "@/services/constant";

const API_BASE_URL = process.env.KIEAI_API_BASE_ENDPOINT;
const API_KEY = process.env.KIEAI_API_KEY;

const REQUIRED_CREDITS = 50;

if (!API_KEY) {
  console.error("KIEAI API key is not set in environment variables");
}

async function generateVideoWithPrompt(
  data: GenerateVideoRequest,
  isRetry: boolean = false
): Promise<GenerateVideoResponse> {
  const response = await fetch(`${API_BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate video: ${response.statusText}`);
  }

  if (!isRetry) {
    const user_uuid = await getUserUuid();
    if (user_uuid) {
      await decreaseCredits({
        user_uuid,
        trans_type: CreditsTransType.Ping,
        credits: REQUIRED_CREDITS,
      });
      console.log(
        `Generate text-to-video success with ${REQUIRED_CREDITS} credits consumption`
      );
    }
  }

  return response.json();
}

function buildErrorResponse(
  status: number,
  code: number,
  message: string,
  details?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    } satisfies ApiErrorResponse,
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return buildErrorResponse(500, 500, "API key not configured");
    }

    const body = (await request.json()) as {
      prompt?: string;
      model?: string;
      ratio?: string;
      isRetry?: boolean;
    };

    const { prompt, model, ratio = "16:9", isRetry = false } = body;

    if (!prompt || !prompt.trim()) {
      return buildErrorResponse(400, 400, "Prompt is required");
    }

    if (!model || !model.trim()) {
      return buildErrorResponse(400, 400, "Model is required");
    }

    const user_uuid = await getUserUuid();
    if (user_uuid && !isRetry) {
      const userCredits: UserCredits = await getUserCredits(user_uuid);
      if ((userCredits.left_credits ?? 0) < REQUIRED_CREDITS) {
        return buildErrorResponse(
          402,
          ErrorCode.InSufficientCredits,
          "Insufficient credits"
        );
      }
    }

    const aspect_ratio = ratio === "16:9" ? "landscape" : "portrait";

    const generateVideoRequest: GenerateVideoRequest = {
      model,
      input: {
        prompt,
        aspect_ratio,
      },
    };

    const responsePayload = await generateVideoWithPrompt(
      generateVideoRequest,
      isRetry
    );

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Sora2 text-to-video API error:", error);

    return buildErrorResponse(
      500,
      ErrorCode.APIError,
      "Internal server error",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
