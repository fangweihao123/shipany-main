"use client";
import { PromptEngine } from "@/types/blocks/imagegenerator";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import { PromptInputBlock } from "./promptInput";
import { MultiImgUpload } from "./MultiImgUpload";
import { editImage, generateImage, UploadFiles } from "@/services/generator";
import { GeneratorOutput } from "@/types/generator";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTrial } from "@/lib/trial";
import { GeneratorError } from "@/services/generator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { pollTaskResult } from "@/lib/utils";

const MAX_GENERATE_ATTEMPTS = 3;

interface PromptEngineProps {
  promptEngine: PromptEngine;
  onOutputsChange?: (outputs: GeneratorOutput[]) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

function normalizeOutputs(result: any): GeneratorOutput[] {
  const outputs: unknown[] = result?.data?.outputs ?? result?.outputs ?? [];
  if (!Array.isArray(outputs)) {
    return [];
  }

  return outputs.flatMap((entry: any, index) => {
    const image = entry?.image ?? entry;
    if (!image) {
      return [];
    }

    const base64Payload = image?.b64_json || image?.base64 || image?.b64 || image?.data || image?.image_base64 || null;
    const mimeType = image?.mime_type || image?.mimeType || (base64Payload ? "image/png" : undefined);
    const dataUrl = base64Payload ? `data:${mimeType};base64,${base64Payload}` : undefined;
    const remoteUrl = image?.url || image?.public_url || image?.publicUrl || image?.image_url || image?.signed_url;
    const explicitDataUrl = image?.data_url || image?.dataUrl;
    const directString = typeof image === "string" ? image : undefined;

    const src = explicitDataUrl || dataUrl || remoteUrl || directString;
    if (!src) {
      return [];
    }

    return [{
      id: entry?.id ?? result?.data?.id ?? String(index),
      src,
      mimeType,
    }];
  });
}

export function PromptEngineBlock({ promptEngine, onOutputsChange, onGeneratingChange }: PromptEngineProps) {
  const [mode, setMode] = useState<"i2i" | "t2i" | "i2v">("i2i");
  const [failure, setFailure] = useState<"insuficientcredits" | "apierror" | "normal">("normal");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [vfiles, setVFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  const canGenerate = useMemo(() => {
    if (mode === "t2i") {
      return prompt.length > 0;
    }
    if (mode === "i2i") {
      return prompt.length > 0 && files.length > 0;
    }
    return false;
  }, [mode, prompt, files]);

  const onGenerateClick = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    setFailure("normal");

    // 梳理一下逻辑 即先检测一下是否登录了 未登录则之间扣除本地的点数 如果登陆了先检测一下credits是否够用
    if (status === 'unauthenticated'){
      if(!useTrial()){
        setShowAuthDialog(true);
        setTimeout(() => router.push('/auth/signin'), 2200);
        return;
      }
    }

    try {
      setIsGenerating(true);
      onGeneratingChange?.(true);
      for(let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++){
        try{
          let id = "";
          if(mode === "t2i"){
            id = await generateImage(prompt, "nanobananat2i", attempt > 1);
          }else if(mode === "i2i"){
            const filesUrl = await UploadFiles(files, "nanobananai2i");
            id = await editImage(filesUrl, prompt, "nanobananai2i", attempt > 1);
          }
          const queryResult = await pollTaskResult(id);
          const normalized = normalizeOutputs(queryResult);
          onOutputsChange?.(normalized);
          console.log("final query result", queryResult);
          break;
        }catch(error){
          const generatorError = error as GeneratorError;
          if(generatorError){
            if(generatorError.code === 500){
              continue;
            }
          }
          throw error;
        }
      }
    } catch (error) {
      console.error("failed to generate", error);
      const generatorError = error as GeneratorError;
      if(generatorError){
        if(generatorError.code === 100){
          setFailure("insuficientcredits");
        }else if(generatorError.code === 200){
          setFailure("apierror");
        }
      }
      onOutputsChange?.([]);
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  const onPromptChange = (value: string) => {
    setPrompt(value);
  };

  const ButtonText = () => {
    if(failure === "normal"){
      if(isGenerating){
        return generatingText;
      }else{
        return promptEngine.generateButton?.title;
      }
    }else if(failure === "apierror"){
      return promptEngine.api_error;
    }else if(failure === "insuficientcredits"){
      return promptEngine.insufficient_credits;
    }
  };

  const promptEngineSelector = () => {
    if(mode === "i2i"){
      return (
        <div>
          <MultiImgUpload 
            uploadInfo={promptEngine.image2Image?.upload}
            onChange={setFiles}
            >

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
    }else if(mode === "i2v"){
      return (
        <div>
          <MultiImgUpload 
            uploadInfo={promptEngine.image2Video?.upload}
            maxFiles={3}
            onChange={setVFiles}
            >

          </MultiImgUpload>
          <PromptInputBlock
            promptInput = {promptEngine.image2Video?.input}
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
  const generatingText = promptEngine.states?.generating
    || promptEngine.generateButton?.loadingTitle
    || promptEngine.generateButton?.title
    || "";
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Dialog open={showAuthDialog}>
        <DialogTitle>
          {''}
        </DialogTitle>
        <DialogContent className="sm:max-w-[420px]">
            <DialogDescription>
              {promptEngine?.auth_Required || ''}
            </DialogDescription>
          </DialogContent>
      </Dialog>
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
            <Button 
              type="button"
              onClick={()=> setMode("i2v")}
              className= {`w-30 rounded-none ${mode === "i2v" ? activeBtn : inactiveBtn}`} >
              {promptEngine.image2VideoTab}
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
          disabled={!canGenerate || isGenerating}
          >
          {ButtonText()}
        </Button>
      </div>
    </div>

  );
}
