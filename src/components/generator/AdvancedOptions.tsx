"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { AdvancedOptions } from "@/types/blocks/imagegenerator";

interface ImageAdvancedOptionsProps {
  outputFormat: 'png' | 'jpeg';
  onOutputFormatChange: (format: 'png' | 'jpeg') => void;
  advancedOptions?: AdvancedOptions;
}

interface VideoAdvancedOptionsProps {
  aspectRatio: '16:9' | '9:16';
  onAspectRatioChange: (ratio: '16:9' | '9:16') => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  resolution: '720p' | '1080p';
  onResolutionChange: (resolution: '720p' | '1080p') => void;
  generateAudio: boolean;
  onGenerateAudioChange: (generate: boolean) => void;
  negativePrompt: string;
  onNegativePromptChange: (prompt: string) => void;
  seed?: number;
  onSeedChange: (seed: number | undefined) => void;
  advancedOptions?: AdvancedOptions;
}

export function ImageAdvancedOptions({ 
  outputFormat, 
  onOutputFormatChange,
  advancedOptions
}: ImageAdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-background/50">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between px-4 py-3 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>{advancedOptions?.title || "Advanced Options"}</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="space-y-2 mt-2">
            <Label htmlFor="output-format">{advancedOptions?.outputFormat?.label || "Output Format"}</Label>
            <Select value={outputFormat} onValueChange={onOutputFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">{advancedOptions?.outputFormat?.png || "PNG"}</SelectItem>
                <SelectItem value="jpeg">{advancedOptions?.outputFormat?.jpeg || "JPEG"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoAdvancedOptions({
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  resolution,
  onResolutionChange,
  generateAudio,
  onGenerateAudioChange,
  negativePrompt,
  onNegativePromptChange,
  seed,
  onSeedChange,
  advancedOptions
}: VideoAdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-background/50">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between px-4 py-3 h-auto font-normal"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>{advancedOptions?.title || "Advanced Options"}</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">{advancedOptions?.aspectRatio?.label || "Aspect Ratio"}</Label>
              <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">{advancedOptions?.aspectRatio?.landscape || "16:9 (Landscape)"}</SelectItem>
                  <SelectItem value="9:16">{advancedOptions?.aspectRatio?.portrait || "9:16 (Portrait)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resolution">{advancedOptions?.resolution?.label || "Resolution"}</Label>
              <Select value={resolution} onValueChange={onResolutionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="generate-audio"
              checked={generateAudio}
              onCheckedChange={onGenerateAudioChange}
            />
            <Label htmlFor="generate-audio">{advancedOptions?.generateAudio?.label || "Generate Audio"}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="negative-prompt">{advancedOptions?.negativePrompt?.label || "Negative Prompt (Optional)"}</Label>
            <Textarea
              id="negative-prompt"
              placeholder={advancedOptions?.negativePrompt?.placeholder || "Describe what you don't want in the video..."}
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed">{advancedOptions?.seed?.label || "Seed (Optional)"}</Label>
            <Input
              id="seed"
              type="number"
              placeholder={advancedOptions?.seed?.placeholder || "Leave empty for random generation"}
              value={seed || ''}
              onChange={(e) => {
                const value = e.target.value;
                onSeedChange(value ? Number(value) : undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}