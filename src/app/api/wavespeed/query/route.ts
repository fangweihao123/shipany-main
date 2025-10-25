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

function inferMimeTypeFromUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  const clean = url.split("?")[0]?.toLowerCase();
  if (!clean) {
    return undefined;
  }

  if (clean.endsWith(".mp4")) return "video/mp4";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".m4v")) return "video/mp4";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".bmp")) return "image/bmp";
  if (clean.endsWith(".tiff") || clean.endsWith(".tif")) return "image/tiff";
  return undefined;
}

function determineMimeType(entry: any, fallbackUrl?: string): string {
  const rawType =
    entry?.mime_type ||
    entry?.mimeType ||
    entry?.content_type ||
    entry?.contentType ||
    entry?.type ||
    entry?.format ||
    entry?.output_format;

  if (rawType) {
    const value = String(rawType).toLowerCase();
    if (value.includes("/")) {
      return value;
    }
    const simpleMap: Record<string, string> = {
      video: "video/mp4",
      image: "image/png",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      m4v: "video/mp4",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      bmp: "image/bmp",
      tif: "image/tiff",
      tiff: "image/tiff",
    };
    if (simpleMap[value]) {
      return simpleMap[value];
    }
    const inferredFromRaw = inferMimeTypeFromUrl(`dummy.${value}`);
    if (inferredFromRaw) {
      return inferredFromRaw;
    }
  }

  if (typeof fallbackUrl === "string" && fallbackUrl.startsWith("data:")) {
    const match = fallbackUrl.match(/^data:(.+?);/);
    if (match?.[1]) {
      return match[1];
    }
  }

  const urlCandidate =
    fallbackUrl ||
    entry?.url ||
    entry?.video_url ||
    entry?.videoUrl ||
    entry?.image_url ||
    entry?.imageUrl ||
    entry?.public_url ||
    entry?.publicUrl ||
    entry?.signed_url;

  const inferred = inferMimeTypeFromUrl(
    typeof urlCandidate === "string" ? urlCandidate : undefined
  );
  if (inferred) {
    return inferred;
  }

  return "image/png";
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
    "video/quicktime": "mov",
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
    const media =
      entry?.video ??
      entry?.image ??
      entry?.media ??
      entry?.asset ??
      entry;

    if (!media) {
      continue;
    }

    const remoteUrl =
      media?.url ||
      media;

    const mimeType = determineMimeType(media, remoteUrl);
    let uploaded: UploadedAsset | null = null;
    if (typeof media === "string" && media.startsWith("http")) {
      uploaded = await uploadAssetFromUrl(media, mimeType);
    }

    if (uploaded) {
      const metadata: Record<string, unknown> = {};
      metadata.kind = mimeType.toLowerCase().startsWith("video/") ? "video" : "image";
      assets.push({
        id: entry?.id || media?.id || undefined,
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
