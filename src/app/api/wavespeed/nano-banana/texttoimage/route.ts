import { NextRequest, NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/types/detect";
import { getUserUuid } from "@/services/user";
import { HasEnoughCredits } from "@/services/credits/credit.lib";
import { ErrorCode, TaskCreditsConsumption } from "@/services/constant";
import { GeneratorProvider } from "@/types/generator";
import { TaskProvider } from "@/types/task";
import { getClientIp, getSerialCode } from "@/lib/ip";
import { canUseTrialService, increaseTaskTrialUsage } from "@/services/trialtask";
import { CreditsTransType, decreaseCredits } from "@/services/credit";
import { logGenerationTask } from "@/services/generation-task";
import type {
  GenerateImgRequest,
  GenerateImgResponse,
} from "@/types/wavespeed/nanobanana/image";

const API_BASE_URL = process.env.WAVESPEED_API_BASE_ENDPOINT;
const API_KEY = process.env.WAVESPEED_API_KEY;

const generatorModel: GeneratorProvider = "nanobananat2i";
const taskCreditsConsumption = TaskCreditsConsumption[generatorModel] ?? 0;
const taskCode: TaskProvider = "GenerateVideo";

interface TextToImagePayload {
  prompt?: string;
  isRetry?: boolean;
  output_format?: string;
  enable_base64_output?: boolean;
  enable_sync_mode?: boolean;
}

if (!API_KEY) {
  console.error("API key is not set in environment variables");
}

async function generateImageWithPrompt(
  data: GenerateImgRequest
): Promise<GenerateImgResponse> {
  const response = await fetch(`${API_BASE_URL}/google/nano-banana/text-to-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
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

    const payload: TextToImagePayload = await request.json();
    const {
      prompt,
      isRetry = false,
      output_format = "png",
      enable_base64_output,
      enable_sync_mode,
    } = payload;

    if (!prompt || !prompt.trim()) {
      return buildErrorResponse(400, 400, "Prompt is required");
    }

    const user_uuid = await getUserUuid();
    const fingerPrint = await getSerialCode();
    const ip = await getClientIp();

    if (!user_uuid && !fingerPrint && !isRetry) {
      return buildErrorResponse(
        400,
        ErrorCode.APIError,
        "Missing device identifier for trial usage"
      );
    }

    if (!isRetry) {
      if (user_uuid) {
        const enoughCredits = await HasEnoughCredits(
          user_uuid,
          taskCreditsConsumption
        );
        if (!enoughCredits) {
          return buildErrorResponse(
            402,
            ErrorCode.InSufficientCredits,
            "Insufficient credits"
          );
        }
      } else {
        const canTrial = await canUseTrialService({
          fingerPrint,
          ip,
          task_code: taskCode,
        });
        if (!canTrial) {
          return buildErrorResponse(
            429,
            ErrorCode.RunOutTrial,
            "Trial limit reached"
          );
        }
      }
    }

    const generateImgRequest: GenerateImgRequest = {
      prompt,
      ...(output_format ? { output_format } : {}),
      ...(enable_base64_output !== undefined
        ? { enable_base64_output }
        : {}),
      ...(enable_sync_mode !== undefined ? { enable_sync_mode } : {}),
    };

    const generateImgResponse = await generateImageWithPrompt(generateImgRequest);
    const responsePayload = generateImgResponse as unknown as Record<string, any>;
    const taskId =
      responsePayload?.data?.id ||
      responsePayload?.data?.taskId ||
      responsePayload?.id ||
      responsePayload?.taskId ||
      responsePayload?.requestId;

    if (taskId) {
      await logGenerationTask({
        taskId,
        prompt,
        mode: "t2i",
        userUuid: user_uuid || undefined,
        deviceFingerprint: fingerPrint || undefined,
        metadata: {
          output_format,
          provider: generatorModel,
          ip,
          isRetry: Boolean(isRetry),
        },
      });
    }

    if (!isRetry) {
      if (user_uuid) {
        await decreaseCredits({
          user_uuid,
          trans_type: CreditsTransType.Ping,
          credits: taskCreditsConsumption,
        });
        console.log(
          `Generate image success with ${taskCreditsConsumption} credits consumption`
        );
      } else {
        await increaseTaskTrialUsage({
          fingerPrint,
          ip,
          task_code: taskCode,
          times: 1,
        });
        console.log(
          `Device ${fingerPrint} ip ${ip} generate image success with free trial`
        );
      }
    }

    return NextResponse.json(generateImgResponse);
  } catch (error) {
    console.error("Nano Banana text-to-image API error:", error);

    return buildErrorResponse(
      500,
      ErrorCode.APIError,
      "Internal server error",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
