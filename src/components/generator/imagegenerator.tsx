"use client";

import { ImageGenerator } from "@/types/blocks/imagegenerator";
import { OutputGalleryBlock } from "./outputgallery";
import { PromptEngineBlock } from "./promptengine";

export interface ImageGeneratorProps{
  imageGenerator?: ImageGenerator;
}

export function ImageGeneratorBlock({ imageGenerator }: ImageGeneratorProps) {

  return (
    <div id="generator" className="container">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-10 lg:flex-row lg:items-stretch">
        {imageGenerator?.promptEngine && (
          <div className="flex flex-1">
            <PromptEngineBlock promptEngine={imageGenerator.promptEngine} />
          </div>
        )}

        {imageGenerator?.outputGallery && (
          <div className="flex flex-1">
            <OutputGalleryBlock outputGallery={imageGenerator.outputGallery} />
          </div>
        )}
      </div>
    </div>
  );
}
