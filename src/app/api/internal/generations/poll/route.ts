import { NextRequest, NextResponse } from "next/server";
import { listPendingGenerationTasks, updateGenerationTask } from "@/services/generation-task";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";
import type { GenerationAsset, GenerationStatus } from "@/types/generation";

const API_QUERY_ENDPOINT = process.env.WAVESPEED_API_QUERY_ENDPOINT || "";
const API_KEY = process.env.WAVESPEED_API_KEY || "";
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || "nano-banana";
const CRON_SECRET = process.env.CRON_SECRET || "";
const ENVIRONMENT = process.env.NODE_ENV || "";

export const runtime = "nodejs";

function ensureAuthorized(request: NextRequest) {
  if (!CRON_SECRET) {
    throw new Error("INTERNAL_CRON_SECRET is not configured");
  }

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${process.env.CRON_SECRET}`) {
    const error = new Error("Unauthorized");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}

async function fetchTaskStatus(taskId: string) {
  if (!API_QUERY_ENDPOINT || !API_KEY) {
    throw new Error("Wavespeed query endpoint not configured");
  }

  const url = API_QUERY_ENDPOINT.replace("{requestId}", taskId);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch task status: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function inferStatus(rawStatus: string | undefined): GenerationStatus | "unknown" {
  if (!rawStatus) {
    return "unknown";
  }

  const normalized = rawStatus.toLowerCase();

  if (["pending", "queued", "queueing"].includes(normalized)) {
    return "pending";
  }

  if (["processing", "running", "generating", "in_progress"].includes(normalized)) {
    return "processing";
  }

  if (["finished", "completed", "succeeded", "success"].includes(normalized)) {
    return "completed";
  }

  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }

  return "unknown";
}

function determineMimeType(entry: any): string {
  return (
    entry?.mime_type ||
    entry?.mimeType ||
    (entry?.type && String(entry.type)) ||
    "image/png"
  );
}

function determineExtension(mimeType: string): string {
  const mapping: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };

  return mapping[mimeType.toLowerCase()] || "png";
}

async function uploadAssetFromBase64(base64: string, mimeType: string) {
  if (!base64) {
    throw new Error("Empty base64 payload");
  }

  const storage = newStorage();
  const key = `${PROJECT_NAME}/generations/${getUuid()}.${determineExtension(mimeType)}`;
  const binary = Buffer.from(base64, "base64");

  const result = await storage.uploadFile({
    body: binary,
    key,
    contentType: mimeType,
  });

  return {
    r2Url: result.url,
    r2Key: key,
  };
}

async function uploadAssetFromUrl(url: string, mimeType: string | undefined) {
  const storage = newStorage();
  const keyExtension = determineExtension(mimeType || "image/png");
  const key = `${PROJECT_NAME}/generations/${getUuid()}.${keyExtension}`;

  const uploadResult = await storage.downloadAndUpload({
    url,
    key,
    contentType: mimeType,
  });

  return {
    r2Url: uploadResult.url,
    r2Key: key,
  };
}

async function convertOutputsToAssets(outputs: any[]): Promise<GenerationAsset[]> {
  const assets: GenerationAsset[] = [];

  for (const entry of outputs) {
    const image = entry?.image ?? entry;
    if (!image) {
      continue;
    }

    const base64Payload =
      image?.b64_json ||
      image?.base64 ||
      image?.b64 ||
      image?.data ||
      image?.image_base64 ||
      null;
    const explicitDataUrl = image?.data_url || image?.dataUrl;
    const remoteUrl =
      image?.url ||
      image?.public_url ||
      image?.publicUrl ||
      image?.image_url ||
      image?.signed_url;

    const mimeType = determineMimeType(image);
    let uploaded: { r2Url: string; r2Key: string } | null = null;

    try {
      if (explicitDataUrl && explicitDataUrl.startsWith("data:")) {
        const [, meta, payload] =
          explicitDataUrl.match(/^data:(.+);base64,(.*)$/) || [];
        if (payload) {
          const contentType = meta || mimeType;
          uploaded = await uploadAssetFromBase64(payload, contentType);
        }
      } else if (base64Payload) {
        uploaded = await uploadAssetFromBase64(base64Payload, mimeType);
      } else if (remoteUrl) {
        uploaded = await uploadAssetFromUrl(remoteUrl, mimeType);
      } else if (typeof image === "string" && image.startsWith("data:")) {
        const [, meta, payload] = image.match(/^data:(.+);base64,(.*)$/) || [];
        if (payload) {
          uploaded = await uploadAssetFromBase64(payload, meta || mimeType);
        }
      } else if (typeof image === "string" && image.startsWith("http")) {
        uploaded = await uploadAssetFromUrl(image, mimeType);
      }
    } catch (error) {
      console.error("Failed to upload generation asset", error);
      continue;
    }

    if (uploaded) {
      assets.push({
        id: entry?.id || image?.id || undefined,
        mimeType,
        sourceUrl: remoteUrl || undefined,
        r2Key: uploaded.r2Key,
        r2Url: uploaded.r2Url,
        metadata: {
          width: image?.width,
          height: image?.height,
        },
      });
    }
  }

  return assets;
}

export async function GET(request: NextRequest) {
  try {
    if (ENVIRONMENT === "production"){
      ensureAuthorized(request);
    }

    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 10);
    const limit = Number.isNaN(limitParam)
      ? 10
      : Math.max(1, Math.min(limitParam, 25));

    const pendingTasks = await listPendingGenerationTasks(limit);
    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No pending tasks",
      });
    }

    let processed = 0;
    const results: Array<{ taskId: string; status: GenerationStatus | "unknown" }> = [];

    for (const task of pendingTasks) {
      try {
        const statusResponse = await fetchTaskStatus(task.task_id);
        const providerStatus = inferStatus(
          statusResponse?.data?.status || statusResponse?.status
        );

        if (providerStatus === "pending" || providerStatus === "unknown") {
          const currentStatus = (task.status as GenerationStatus) || "pending";
          await updateGenerationTask(task.task_id, {
            status:
              providerStatus === "pending" ? "pending" : currentStatus,
            retryIncrement: 1,
            metadata: {
              ...(task.metadata || {}),
              lastResponse: statusResponse,
            },
          });
        } else if (providerStatus === "processing") {
          await updateGenerationTask(task.task_id, {
            status: "processing",
            retryIncrement: 1,
            metadata: {
              ...(task.metadata || {}),
              lastResponse: statusResponse,
            },
          });
        } else if (providerStatus === "completed") {
          const outputs =
            statusResponse?.data?.outputs || statusResponse?.outputs || [];
          const assets = await convertOutputsToAssets(outputs);

          await updateGenerationTask(task.task_id, {
            status: "completed",
            assets,
            metadata: {
              ...(task.metadata || {}),
              lastResponse: statusResponse,
            },
          });
        } else if (providerStatus === "failed") {
          await updateGenerationTask(task.task_id, {
            status: "failed",
            errorMessage:
              statusResponse?.data?.error?.message ||
              statusResponse?.error?.message ||
              "Generation failed",
            metadata: {
              ...(task.metadata || {}),
              lastResponse: statusResponse,
            },
          });
        }

        processed += 1;
        results.push({ taskId: task.task_id, status: providerStatus });
      } catch (error) {
        console.error(`Failed to process task ${task.task_id}`, error);
        await updateGenerationTask(task.task_id, {
          status: "processing",
          retryIncrement: 1,
          metadata: {
            ...(task.metadata || {}),
            lastError: (error as Error).message,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      results,
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: status,
          message: (error as Error).message,
        },
      },
      { status }
    );
  }
}
