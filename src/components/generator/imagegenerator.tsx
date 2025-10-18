"use client";

import { ImageGenerator } from "@/types/blocks/imagegenerator";
import { OutputGalleryBlock } from "./outputgallery";
import { useState } from "react";
import { GenerationStatus, GeneratorOutput } from "@/types/generator";
import { motion } from "framer-motion";
import { SoraPromptEngineBlock } from "./sorapromptengine";

export interface ImageGeneratorProps{
  imageGenerator?: ImageGenerator;
}

export function ImageGeneratorBlock({ imageGenerator }: ImageGeneratorProps) {
  const [outputs, setOutputs] = useState<GeneratorOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({ active: false });

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  return (
    <div id="generator" className="container my-40">
      <motion.div
        custom={2}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
      >
         <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-10 lg:flex-row lg:items-stretch">
          {imageGenerator?.promptEngine && (
            <div className="flex flex-1">
              <SoraPromptEngineBlock
                promptEngine={imageGenerator.promptEngine}
                onOutputsChange={setOutputs}
                onGeneratingChange={setIsGenerating}
                onGenerationStatusChange={setGenerationStatus}
              />
            </div>
          )}

          {imageGenerator?.outputGallery && (
            <div className="flex flex-1">
              <OutputGalleryBlock
                outputGallery={imageGenerator.outputGallery}
                outputs={outputs}
                isGenerating={isGenerating}
                generationStatus={generationStatus}
                imagePreview={outputs[0]?.src}
              />
            </div>
          )}
        </div>
      </motion.div>
     
    </div>
  );
}
