"use client";
import { OutputGallery } from "@/types/blocks/imagegenerator";
import { Card } from "fumadocs-ui/components/card";
import { Button } from "../ui/button";
import { GenerationStatus, GeneratorOutput } from "@/types/generator";
import { useEffect, useMemo, useState } from "react";

interface OutputGalleryProps {
  outputGallery: OutputGallery;
  imagePreview?: string | null;
  outputs?: GeneratorOutput[];
  isGenerating?: boolean;
  generationStatus?: GenerationStatus;
}

export function OutputGalleryBlock({ outputGallery, imagePreview, outputs = [], isGenerating = false, generationStatus }: OutputGalleryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const galleryItems: GeneratorOutput[] = outputs.length > 0
    ? outputs
    : imagePreview
      ? [{ id: "preview", src: imagePreview }]
      : [];

  const isEmpty = galleryItems.length === 0;
  const loadingMessage = outputGallery.messages?.loading ?? "Generating, please wait...";
  const emptyMessage = outputGallery.messages?.empty ?? "Generated images will appear here";
  const imageAlt = outputGallery.messages?.imageAlt ?? "Generated image";
  const downloadLabel = outputGallery.downloadButton?.title ?? "Download";

  const showOverlay = Boolean(generationStatus?.active);
  const normalizedProgress = showOverlay ? Math.min(Math.max(progress, 0.02), 0.97) : 0;
  const variantLabel = generationStatus?.variant === 'pro'
    ? 'Sora 2 Pro'
    : generationStatus?.variant === 'standard'
      ? 'Sora 2'
      : undefined;
  const primaryMessage = generationStatus?.variant === 'pro'
    ? "Rendering with Sora 2 Pro..."
    : "AI is creating...";
  const secondaryMessage = outputGallery.messages?.loading || "Please wait a moment, something amazing is coming";
  const isDownloadInProgress = Boolean(downloadingId);

  const inferredEtaMs = useMemo(() => {
    if (!generationStatus) return 0;
    if (generationStatus.etaMs) return generationStatus.etaMs;
    if (generationStatus.variant === 'pro') return 10 * 60 * 1000;
    if (generationStatus.variant === 'standard') return 3 * 60 * 1000;
    return 3 * 60 * 1000;
  }, [generationStatus]);

  useEffect(() => {
    if (generationStatus?.active) {
      const start = generationStatus.startedAt ?? Date.now();
      const tick = () => {
        const eta = inferredEtaMs || 1;
        const elapsed = Date.now() - start;
        const ratio = Math.min(elapsed / eta, 0.98);
        setProgress(Number.isFinite(ratio) ? ratio : 0);
        setRemainingMs(Math.max(eta - elapsed, 0));
      };

      tick();
      const interval = window.setInterval(tick, 1000);
      return () => window.clearInterval(interval);
    }

    setProgress(0);
    setRemainingMs(0);
    return undefined;
  }, [generationStatus?.active, generationStatus?.startedAt, inferredEtaMs]);

  const etaLabel = useMemo(() => {
    if (!generationStatus?.active) return null;
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.max(Math.floor(totalSeconds / 60), 0);
    const seconds = Math.max(totalSeconds % 60, 0);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [generationStatus?.active, remainingMs]);

  const handleDownload = async (items: GeneratorOutput[]) => {
    const item = items.at(0);
    if(item === undefined){
      return;
    }
    const itemId = item.id ?? item.src;
    const isVideo = item.mimeType?.startsWith('video/') || item.src.includes('.mp4') || item.src.includes('video');
    
    // 智能确定文件扩展名
    let fileExtension = '.png'; // 默认为png
    if (isVideo) {
      fileExtension = '.mp4';
    } else {
      // 根据mimeType确定图片格式
      if (item.mimeType?.includes('jpeg') || item.mimeType?.includes('jpg')) {
        fileExtension = '.jpg';
      } else if (item.mimeType?.includes('png')) {
        fileExtension = '.png';
      } else if (item.mimeType?.includes('webp')) {
        fileExtension = '.webp';
      } else {
        // 从URL中推断文件扩展名
        const urlLower = item.src.toLowerCase();
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
          fileExtension = '.jpg';
        } else if (urlLower.includes('.png')) {
          fileExtension = '.png';
        } else if (urlLower.includes('.webp')) {
          fileExtension = '.webp';
        }
        // 如果都无法确定，保持默认的.png
      }
    }
    
    setDownloadingId(itemId);

    const fallback = () => {
      const anchor = document.createElement("a");
      anchor.href = item.src;
      anchor.download = `${itemId}${fileExtension}`;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    };

    try {
      if (item.src.startsWith("data:")) {
        fallback();
        return;
      }

      const response = await fetch(item.src);
      if (!response.ok) {
        throw new Error(`Failed to download ${isVideo ? 'video' : 'image'}: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${itemId}${fileExtension}`;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      fallback();
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Image Preview */}
      <div className="flex-1 w-full rounded-xl border-2 border-fd-foreground bg-input/[0.4] shadow">
        { /* 顶部区域 */}
        <div className="flex flex-col gap-3 p-4 bg-input">
          <h2 className="text-2xl font-bold text-primary">{outputGallery.title}</h2>
          <p className="text-foreground text-sm">{outputGallery.description}</p>
        </div>
        <div className="m-4">
          <div className="relative">
            <Card
              title={!isGenerating && isEmpty ? outputGallery.dataCard?.title : undefined}
              description={!isGenerating && isEmpty ? outputGallery.dataCard?.description : undefined}
              className="flex flex-1 min-h-[30rem] flex-col items-center justify-center border-4 border-dotted text-center gap-4">
              {isEmpty ? (
                <p className="text-sm text-muted-foreground">
                  {isGenerating
                    ? loadingMessage
                    : emptyMessage}
                </p>
              ) : (
                <div className="w-full gap-4">
                  {galleryItems.map((item) => {
                    const itemId = item.id ?? item.src;
                    const isVideo = item.mimeType?.startsWith('video/') || item.src.includes('.mp4') || item.src.includes('video');

                    return (
                      <div key={itemId} className="flex">
                        {isVideo ? (
                          <video
                            src={item.src}
                            controls
                            className="flex h-full w-full rounded-lg border object-cover"
                            style={{ maxHeight: '500px' }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={item.src}
                            alt={imageAlt}
                            className="flex h-full w-full rounded-lg border object-cover"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            {showOverlay && (
              <GenerationOverlay
                progress={normalizedProgress}
                primaryMessage={primaryMessage}
                secondaryMessage={secondaryMessage}
                etaLabel={etaLabel}
                variantLabel={variantLabel}
              />
            )}
          </div>
          {!isEmpty && 
            <Button
              type="button"
              onClick={() => handleDownload(galleryItems)}
              className="flex w-full mt-4"
              disabled={isDownloadInProgress}
            >
              {isDownloadInProgress
                ? outputGallery.downloadButton?.loadingTitle ?? "Preparing download..."
                : downloadLabel}
            </Button>
          }
          
        </div>
      </div>
    </div>
  );
}

interface GenerationOverlayProps {
  progress: number;
  primaryMessage: string;
  secondaryMessage: string;
  etaLabel: string | null;
  variantLabel?: string;
}

function GenerationOverlay({ progress, primaryMessage, secondaryMessage, etaLabel, variantLabel }: GenerationOverlayProps) {
  const rawPercent = Math.round(progress * 100);
  const percent = Math.max(rawPercent, 1);
  const barWidth = `${Math.max(percent, 4)}%`;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-[1.25rem] bg-background/85 backdrop-blur-lg">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 via-primary to-primary/60 shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/95">
          <span
            className="block h-12 w-12 rounded-full border-4 border-primary/25 border-t-primary animate-spin"
            style={{ animationDuration: "1.4s" }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <h3 className="text-lg font-semibold text-primary-foreground/90">
          {primaryMessage}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {secondaryMessage}
        </p>
        {(variantLabel || etaLabel) && (
          <div className="text-xs text-muted-foreground/80 flex flex-col items-center gap-1">
            {variantLabel && <span>{variantLabel}</span>}
            {etaLabel && <span>ETA {etaLabel}</span>}
          </div>
        )}
      </div>
      <div className="w-3/4 max-w-md">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted/40 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-primary to-indigo-500 transition-[width] duration-700 ease-out"
            style={{ width: barWidth }}
          />
        </div>
        <div className="mt-2 text-center text-xs font-medium text-muted-foreground">
          {percent}% complete
        </div>
      </div>
    </div>
  );
}
