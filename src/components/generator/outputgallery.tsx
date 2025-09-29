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
          <Card
            title={!isGenerating&&isEmpty ? outputGallery.dataCard?.title : undefined}
            description={!isGenerating&&isEmpty ? outputGallery.dataCard?.description : undefined}
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
          {!isEmpty && 
            <Button
              type="button"
              onClick={() => handleDownload(galleryItems)}
              className="flex w-full mt-4"
            >
              {downloadLabel}
            </Button>
          }
          
        </div>
      </div>
    </div>
  );
}
