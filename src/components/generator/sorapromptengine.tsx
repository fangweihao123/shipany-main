"use client";
import { PromptEngine } from "@/types/blocks/imagegenerator";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import { PromptInputBlock } from "./promptInput";
import { MultiImgUpload } from "./MultiImgUpload";
import { editImage, generateImage, generateVideo, UploadFiles } from "@/services/generator";
import { GeneratorOutput } from "@/types/generator";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { useRouter } from "next/navigation";
import { GeneratorError } from "@/services/generator";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { pollKieTaskResult, pollTaskResult } from "@/lib/utils";
import { ImageAdvancedOptions, VideoAdvancedOptions } from "./AdvancedOptions";
import Icon from "../icon";
import { ErrorCode } from "@/services/constant";
import { ModelSelector } from "./ModelSelector";

const MAX_GENERATE_ATTEMPTS = 3;

interface PromptEngineProps {
  promptEngine: PromptEngine;
  onOutputsChange?: (outputs: GeneratorOutput[]) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

function normalizeOutputs(result: any): GeneratorOutput[] {
  const resultJson = JSON.parse(result.data.resultJson); 
  const outputs: unknown[] = resultJson?.resultUrls ?? [];
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

export function SoraPromptEngineBlock({ promptEngine, onOutputsChange, onGeneratingChange }: PromptEngineProps) {
  const [mode, setMode] = useState<"i2i" | "t2i" | "t2v" | "i2v">("t2v");
  const [failure, setFailure] = useState<"insuficientcredits" | "apierror" | "runoutfree" |"normal">("normal");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [vfiles, setVFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  // Advanced options for image generation
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  
  // Advanced options for video generation
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait'>('landscape');
  const [frameCount, setFrameCount] = useState<'10' | '15'>('10');
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [videoModelVariant, setVideoModelVariant] = useState<'standard' | 'pro'>('standard');
  const { status } = useSession();
  const { user } = useAppContext();
  const router = useRouter();
  console.log("user product id", user);

  const canGenerate = useMemo(() => {
    if (mode === "t2i") {
      return prompt.length > 0;
    }
    if (mode === "i2i") {
      return prompt.length > 0 && files.length > 0;
    }
    if (mode === "i2v") {
      return prompt.length > 0 && vfiles.length > 0;
    }
    if (mode === "t2v") {
      return prompt.length > 0;
    }
    return false;
  }, [mode, prompt, files, vfiles]);

  const onGenerateClick = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }
    setFailure("normal");
    const requiresAuth = mode === "t2v" || mode === "i2v";
    if (requiresAuth && status !== "authenticated") {
      setFailure("runoutfree");
      setShowAuthDialog(true);
      if (status !== "loading") {
        setTimeout(() => router.push('/auth/signin'), 2200);
      }
      return;
    }

    try {
      setIsGenerating(true);
      onGeneratingChange?.(true);
      const determineVideoProvider = () => {
        if (mode === "i2v") {
          return (videoModelVariant === 'pro' ? "sora2i2vPro" : "sora2i2v");
        }
        return (videoModelVariant === 'pro' ? "sora2t2vPro" : "sora2t2v");
      };
      const videoProvider = determineVideoProvider();
      if(mode === "i2v"){
        const filesUrl = await UploadFiles(vfiles, videoProvider);
        const videoOptions = {
          aspect_ratio: aspectRatio,
          n_frames: Number(frameCount),
          remove_watermark: removeWatermark,
        };
        const id = await generateVideo(filesUrl, prompt, videoProvider, false, videoOptions);
        const queryResult = await pollKieTaskResult(id);
        const normalized = normalizeOutputs(queryResult);
        onOutputsChange?.(normalized);
        console.log("final query result", queryResult);
      }else if(mode === "t2v"){
        const videoOptions = {
          aspect_ratio: aspectRatio,
          n_frames: Number(frameCount),
          remove_watermark: removeWatermark,
        };
        const id = await generateVideo([], prompt, videoProvider, false, videoOptions);
        const queryResult = await pollKieTaskResult(id);
        const normalized = normalizeOutputs(queryResult);
        onOutputsChange?.(normalized);
        console.log("final query result", queryResult);
      }
    } catch (error) {
      console.error("failed to generate", error);
      const generatorError = error as GeneratorError;
      if(generatorError){
        if(generatorError.code === ErrorCode.InSufficientCredits){
          setFailure("insuficientcredits");
        }else if(generatorError.code === ErrorCode.APIError){
          setFailure("apierror");
        }else if(generatorError.code === ErrorCode.Unauthorized){
          setFailure("runoutfree");
          setShowAuthDialog(true);
          setTimeout(() => router.push('/auth/signin'), 2200);
        }else if(generatorError.code === ErrorCode.RunOutTrial){
          setFailure("runoutfree");
          setShowAuthDialog(true);
          setTimeout(() => router.push('/auth/signin'), 2200);
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

  const modelSelectorCopy = promptEngine.image2Video?.modelSelector || promptEngine.text2Video?.modelSelector;
  const isProModel = videoModelVariant === 'pro';
  const proBadge = modelSelectorCopy?.proTag;

  const CreditsText = () => {
    const renderCredits = (icon?: string, title?: string, allowProOverride: boolean = false) => {
      const activeTitle = allowProOverride && isProModel ? '30' : title;
      if (!activeTitle) {
        return null;
      }

      return (
        <span className="flex items-center gap-2" title={title}>
          {icon && <Icon name={icon} className="size-6" />}
          <span className="text-sm text-muted-foreground">
            {activeTitle}
            {isProModel && proBadge ? ` ${proBadge}` : ""}
          </span>
        </span>
      );
    };

    if (mode === "i2i" && promptEngine.image2ImageCredits) {
      const { icon, title } = promptEngine.image2ImageCredits;
      return renderCredits(icon, title);
    }

    if (mode === "i2v" && promptEngine.image2VideoCredits) {
      const { icon, title } = promptEngine.image2VideoCredits;
      return renderCredits(icon, title, true);
    }

    if (mode === "t2i" && promptEngine.text2ImageCredits) {
      const { icon, title } = promptEngine.text2ImageCredits;
      return renderCredits(icon, title);
    }

    if (mode === "t2v" && promptEngine.text2VideoCredits) {
      const { icon, title } = promptEngine.text2VideoCredits;
      return renderCredits(icon, title, true);
    }

    return null;
  };

  const ButtonText = () => {
    if(failure === "normal"){
      if(isGenerating){
        return generatingText;
      }else{
        return (
            <span className="flex items-center gap-2">
              {promptEngine.generateButton?.title}
              {CreditsText() || ""}
            </span>
          );
      }
    }else if(failure === "apierror"){
      return promptEngine.api_error;
    }else if(failure === "insuficientcredits"){
      return promptEngine.insufficient_credits;
    }else if(failure === "runoutfree"){
      return promptEngine?.auth_Required || promptEngine.insufficient_credits;
    }
  };

  const promptEngineSelector = () => {
    if(mode === "i2i"){
      return (
        <div className="space-y-4">
          <MultiImgUpload 
            uploadInfo={promptEngine.image2Image?.upload}
            onChange={setFiles}
            >

          </MultiImgUpload>
          <PromptInputBlock
            promptInput = {promptEngine.text2Video?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
          <ImageAdvancedOptions
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            advancedOptions={promptEngine.image2Image?.advancedOptions}
          />
        </div>
      );
    }else if(mode === "t2i"){
      return (
        <div className="space-y-4">
          <PromptInputBlock
            promptInput = {promptEngine.text2Video?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
          <ImageAdvancedOptions
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            advancedOptions={promptEngine.text2Video?.advancedOptions}
          />
        </div>
      );
    }
    else if(mode === "t2v"){
      return (
        <div className="space-y-4">
          <ModelSelector
            mode={mode}
            copy={modelSelectorCopy}
            value={videoModelVariant}
            onChange={setVideoModelVariant}
          />
          <PromptInputBlock
            promptInput = {promptEngine.image2Video?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
          <VideoAdvancedOptions
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            frameCount={frameCount}
            onFrameCountChange={setFrameCount}
            removeWatermark={removeWatermark}
            onRemoveWatermarkChange={setRemoveWatermark}
            advancedOptions={promptEngine.image2Video?.advancedOptions}
          />
        </div>
      );
    }else if(mode === "i2v"){
      return (
        <div className="space-y-4">
          <MultiImgUpload 
            uploadInfo={promptEngine.image2Video?.upload}
            maxFiles={9}
            onChange={setVFiles}
            >

          </MultiImgUpload>
          <ModelSelector
            mode={mode}
            copy={modelSelectorCopy}
            value={videoModelVariant}
            onChange={setVideoModelVariant}
          />
          <PromptInputBlock
            promptInput = {promptEngine.image2Video?.input}
            onChange={onPromptChange}>
          </PromptInputBlock>
          <VideoAdvancedOptions
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            frameCount={frameCount}
            onFrameCountChange={setFrameCount}
            removeWatermark={removeWatermark}
            onRemoveWatermarkChange={setRemoveWatermark}
            advancedOptions={promptEngine.image2Video?.advancedOptions}
          />
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
              onClick={()=> setMode("t2v")}
              className= {`w-30 rounded-none ${mode === "t2v" ? activeBtn : inactiveBtn}`} >
              {promptEngine.text2VideoTab}
            </Button>
            <Button 
              type="button"
              onClick={()=> setMode("i2v")}
              className= {`w-30 rounded-none relative ${mode === "i2v" ? activeBtn : inactiveBtn}`} >
              {promptEngine.image2VideoTab}
            </Button>
          </div>
        </div>
        <div className="p-4">
          {promptEngineSelector()}
        </div>
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
