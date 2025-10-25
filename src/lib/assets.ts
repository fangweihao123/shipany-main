import type { GenerationAsset } from "@/types/generation";

const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|mov|m4v|mkv)$/i;

function normalizeKey(key: string): string {
  return key.startsWith("/") ? key.slice(1) : key;
}

export function resolveAssetUrl(
  asset: GenerationAsset | undefined,
  publicBase?: string
): string {
  if (!asset) {
    return "";
  }

  if (asset.r2Key && publicBase) {
    return `${publicBase}/${normalizeKey(asset.r2Key)}`;
  }

  if (asset.publicUrl) {
    return asset.publicUrl;
  }

  if (asset.r2Url) {
    return asset.r2Url;
  }

  if (asset.sourceUrl) {
    return asset.sourceUrl;
  }

  return "";
}

function inferMimeFromMetadata(asset: GenerationAsset | undefined): string | undefined {
  const kind = (asset?.metadata as Record<string, unknown> | undefined)?.kind;
  if (typeof kind === "string") {
    if (kind.toLowerCase() === "video") {
      return "video/mp4";
    }
    if (kind.toLowerCase() === "image") {
      return "image/png";
    }
  }
  return undefined;
}

export function isVideoAsset(asset: GenerationAsset | undefined, assetUrl?: string): boolean {
  const mimeType = asset?.mimeType?.toLowerCase() ?? inferMimeFromMetadata(asset)?.toLowerCase();
  if (mimeType && mimeType.startsWith("video/")) {
    return true;
  }

  if (assetUrl && VIDEO_EXTENSION_REGEX.test(assetUrl)) {
    return true;
  }

  return false;
}

export interface AssetDisplayInfo {
  mediaUrl: string;
  isVideo: boolean;
  mimeType?: string;
}

export function resolveAssetDisplayInfo(
  asset: GenerationAsset | undefined,
  publicBase?: string
): AssetDisplayInfo {
  const mediaUrl = resolveAssetUrl(asset, publicBase);
  const isVideo = isVideoAsset(asset, mediaUrl);

  return {
    mediaUrl,
    isVideo,
    mimeType: asset?.mimeType ?? inferMimeFromMetadata(asset),
  };
}
