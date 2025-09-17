"use client";
import { PromptEngine } from "@/types/blocks/imagegenerator";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import { PromptInputBlock } from "./promptInput";
import { MultiImgUpload } from "./MultiImgUpload";
import { generateImage } from "@/services/generator";


interface PromptEngineProps {
  promptEngine: PromptEngine;
}

export function PromptEngineBlock({ promptEngine }: PromptEngineProps) {
  const [mode, setMode] = useState<"i2i" | "t2i">("i2i");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const canGenerate = useMemo(() => {
    if(mode === "t2i"){
      return prompt.length > 0;
    }else if(mode === "i2i"){
      return prompt.length > 0 && files.length > 0;
    }
  },[mode, prompt, files]);

  const onGenerateClick = () => {
    generateImage(files, prompt, "nanobananat2i");
  };

  const onPromptChange = (value: string) => {
    console.log(value);
    setPrompt(value);
  };

  const promptEngineSelector = () => {
    if(mode === "i2i"){
      return (
        <div>
          <MultiImgUpload uploadInfo={promptEngine.image2Image?.upload}>

          </MultiImgUpload>
          <PromptInputBlock
            promptInput = {promptEngine.text2Image?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
        </div>
      );
    }else if(mode === "t2i"){
      return (
        <div>
          <PromptInputBlock
            promptInput = {promptEngine.text2Image?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
        </div>
      );
    }
  };

  const activeBtn =
    "bg-primary text-muted";

  const inactiveBtn =
    "bg-primary-foreground text-muted-foreground";
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex-1 w-full rounded-xl border-2 border-fd-foreground shadow bg-input/[0.4]">
        { /* 顶部区域 */}
        <div className="flex flex-col gap-3 p-4 bg-input">
          <h2 className="text-2xl font-bold text-primary">{promptEngine.title}</h2>
          <p className="text-foreground text-sm">{promptEngine.description}</p>
        </div>
        <div className="flex py-4 justify-center">
          <div className="inline-flex rounded-lg overflow-hidden">
            <Button 
              type="button"
              onClick={()=>setMode("i2i")}
              className= {`w-30 rounded-none ${mode === "i2i" ? activeBtn : inactiveBtn}`}>
              {promptEngine.image2ImageTab}
            </Button>
            <Button 
              type="button"
              onClick={()=> setMode("t2i")}
              className= {`w-30 rounded-none ${mode === "t2i" ? activeBtn : inactiveBtn}`} >
              {promptEngine.text2ImageTab}
            </Button>
          </div>
        </div>
        {promptEngineSelector()}
      </div>
      <div className="flex w-full justify-start">
        <Button
          type="button"
          onClick={onGenerateClick}
          className="w-full"
          disabled={!canGenerate}
          >
          {promptEngine.generateButton?.title}
        </Button>
      </div>
    </div>
    
  );
}
