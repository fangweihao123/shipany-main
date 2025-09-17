"use client";
import { OutputGallery } from "@/types/blocks/imagegenerator";
import { Card } from "fumadocs-ui/components/card";
import { Button } from "../ui/button";

interface OutputGalleryProps {
  outputGallery: OutputGallery;
  imagePreview?: string | null;
}

export function OutputGalleryBlock({ outputGallery, imagePreview }: OutputGalleryProps) {
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
            className="flex flex-1 min-h-[30rem] flex-col items-center justify-center border-4 border-dotted text-center">

          </Card>

          <Button
            type = "button"
            className= "flex w-full mt-4">
            {outputGallery.downloadButton?.title}
          </Button>
        </div>
      </div>
    </div>
  );
}
