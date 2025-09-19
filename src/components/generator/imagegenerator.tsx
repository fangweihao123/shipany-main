"use client";

import { ImageGenerator } from "@/types/blocks/imagegenerator";
import { OutputGalleryBlock } from "./outputgallery";
import { PromptEngineBlock } from "./promptengine";
import { useState } from "react";
import { GeneratorOutput } from "@/types/generator";

export interface ImageGeneratorProps{
  imageGenerator?: ImageGenerator;
}

export function ImageGeneratorBlock({ imageGenerator }: ImageGeneratorProps) {
  const [outputs, setOutputs] = useState<GeneratorOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div id="generator" className="container">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-10 lg:flex-row lg:items-stretch">
        {imageGenerator?.promptEngine && (
          <div className="flex flex-1">
            <PromptEngineBlock
              promptEngine={imageGenerator.promptEngine}
              onOutputsChange={setOutputs}
              onGeneratingChange={setIsGenerating}
            />
          </div>
        )}

        {imageGenerator?.outputGallery && (
          <div className="flex flex-1">
            <OutputGalleryBlock
              outputGallery={imageGenerator.outputGallery}
              outputs={outputs}
              isGenerating={isGenerating}
              imagePreview={outputs[0]?.src}
            />
          </div>
        )}
      </div>
    </div>
  );
}
