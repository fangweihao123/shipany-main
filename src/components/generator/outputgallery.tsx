"use client";
import { OutputGallery } from "@/types/blocks/imagegenerator";
import { Card } from "fumadocs-ui/components/card";
import { Button } from "../ui/button";
import { GeneratorOutput } from "@/types/generator";
import { useState } from "react";

interface OutputGalleryProps {
  outputGallery: OutputGallery;
  imagePreview?: string | null;
  outputs?: GeneratorOutput[];
  isGenerating?: boolean;
}

export function OutputGalleryBlock({ outputGallery, imagePreview, outputs = [], isGenerating = false }: OutputGalleryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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
  const downloadingLabel = outputGallery.downloadButton?.loadingTitle ?? downloadLabel;

  const handleDownload = async (item: GeneratorOutput) => {
    const itemId = item.id ?? item.src;
    setDownloadingId(itemId);

    const fallback = () => {
      const anchor = document.createElement("a");
      anchor.href = item.src;
      anchor.download = `${itemId}.png`;
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
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${itemId}.png`;
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
          <Card
            title={outputGallery.dataCard?.title}
            description={outputGallery.dataCard?.description}
            className="flex flex-1 min-h-[30rem] flex-col items-center justify-center border-4 border-dotted text-center gap-4">
            {isGenerating && !isEmpty && (
              <p className="text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            )}
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? loadingMessage
                  : emptyMessage}
              </p>
            ) : (
              <div className="grid w-full gap-4 sm:grid-cols-2">
                {galleryItems.map((item) => {
                  const itemId = item.id ?? item.src;
                  const isDownloading = downloadingId === itemId;
                  return (
                    <div key={itemId} className="flex flex-col gap-2">
                      <img
                        src={item.src}
                        alt={imageAlt}
                        className="h-auto w-full rounded-lg border object-cover"
                      />
                      <Button
                        type="button"
                        onClick={() => handleDownload(item)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? downloadingLabel : downloadLabel}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
