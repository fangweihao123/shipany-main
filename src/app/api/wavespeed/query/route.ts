import { NextRequest, NextResponse } from 'next/server';
import {
  ApiErrorResponse
} from '@/types/detect';
import { updateGenerationTask } from '@/services/generation-task';
import type { GenerationAsset, GenerationStatus } from '@/types/generation';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';

const API_BASE_URL = process.env.WAVESPEED_API_QUERY_ENDPOINT || "";
const API_KEY = process.env.WAVESPEED_API_KEY;
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || "nano-banana";

export const runtime = "nodejs";

if (!API_KEY) {
  console.error('ERASE_WATERMARK_API_KEY is not set in environment variables');
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

function getPublicBaseUrl() {
  const candidates = [
    process.env.STORAGE_PUBLIC_URL,
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL,
    process.env.STORAGE_DOMAIN,
    process.env.NEXT_PUBLIC_STORAGE_DOMAIN,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  ].filter(Boolean) as string[];

  if (candidates.length === 0) {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucket = process.env.STORAGE_BUCKET;
    if (endpoint && bucket) {
      candidates.push(`${endpoint.replace(/\/$/, "")}/${bucket}`);
    }
  }

  const base = candidates[0] || "";
  if (!base) {
    return "";
  }
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function buildPublicUrl(key: string | undefined) {
  if (!key) return "";
  const base = getPublicBaseUrl();
  if (!base) return "";
  const normalizedKey = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${normalizedKey}`;
}

interface UploadedAsset {
  r2Url: string;
  r2Key: string;
  publicUrl: string;
}

async function uploadAssetFromBase64(base64: string, mimeType: string): Promise<UploadedAsset> {
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
    publicUrl: buildPublicUrl(key) || result.url,
  };
}

async function uploadAssetFromUrl(url: string, mimeType: string | undefined): Promise<UploadedAsset> {
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
    publicUrl: buildPublicUrl(key) || uploadResult.url,
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
    let uploaded: UploadedAsset | null = null;

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
      const metadata: Record<string, unknown> = {};
      if (typeof image?.width === "number") {
        metadata.width = image.width;
      }
      if (typeof image?.height === "number") {
        metadata.height = image.height;
      }
      if (typeof image?.duration === "number") {
        metadata.duration = image.duration;
      }

      assets.push({
        id: entry?.id || image?.id || undefined,
        mimeType,
        sourceUrl: remoteUrl || undefined,
        r2Key: uploaded.r2Key,
        r2Url: uploaded.r2Url,
        publicUrl: uploaded.publicUrl,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }
  }

  return assets;
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
      const outputs =
        queryStatusResponse?.data?.outputs || queryStatusResponse?.outputs || [];
      const normalizedOutputs = Array.isArray(outputs)
        ? outputs
        : outputs
        ? [outputs]
        : [];
      const assets = await convertOutputsToAssets(normalizedOutputs);

      await updateGenerationTask(id, {
        status: "completed",
        assets,
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
