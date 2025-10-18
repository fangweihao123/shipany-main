"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { AdvancedOptions } from "@/types/blocks/imagegenerator";
import { cn } from "@/lib/utils";

interface ImageAdvancedOptionsProps {
  outputFormat: 'png' | 'jpeg';
  onOutputFormatChange: (format: 'png' | 'jpeg') => void;
  advancedOptions?: AdvancedOptions;
}

interface VideoAdvancedOptionsProps {
  aspectRatio: 'landscape' | 'portrait';
  onAspectRatioChange: (ratio: 'landscape' | 'portrait') => void;
  frameCount: '10' | '15';
  onFrameCountChange: (value: '10' | '15') => void;
  removeWatermark: boolean;
  onRemoveWatermarkChange: (generate: boolean) => void;
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
  frameCount,
  onFrameCountChange,
  removeWatermark,
  onRemoveWatermarkChange,
  advancedOptions
}: VideoAdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const aspectRatioOptions = [
    {
      value: 'landscape' as const,
      ratio: '16:9',
      orientation: advancedOptions?.aspectRatio?.landscape || 'Landscape',
    },
    {
      value: 'portrait' as const,
      ratio: '9:16',
      orientation: advancedOptions?.aspectRatio?.portrait || 'Portrait',
    },
  ];

  const frameCountOptions = [
    {
      value: '10' as const,
      label: advancedOptions?.frameCount?.tenSeconds || '10s',
      helper: advancedOptions?.frameCount?.tenSecondsHint || '',
    },
    {
      value: '15' as const,
      label: advancedOptions?.frameCount?.fifteenSeconds || '15s',
      helper: advancedOptions?.frameCount?.fifteenSecondsHint || '',
    },
  ];

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
        <div className="p-4 pt-0 space-y-6">
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">{advancedOptions?.aspectRatio?.label || "Aspect Ratio"}</Label>
              <div className="flex flex-col gap-3 sm:flex-row" id="aspect-ratio">
                {aspectRatioOptions.map((option) => {
                  const isActive = option.value === aspectRatio;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onAspectRatioChange(option.value)}
                      className={cn(
                        "flex h-full w-full flex-col justify-center rounded-2xl border px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-1",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-lg"
                          : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors",
                            isActive ? "border-primary-foreground bg-primary-foreground/10" : "border-border/60"
                          )}
                          aria-hidden="true"
                        >
                          <span
                            className={cn(
                              "rounded-lg border-2 transition-colors",
                              option.value === "landscape" ? "h-4 w-7" : "h-7 w-4",
                              isActive ? "border-primary-foreground" : "border-border/80"
                            )}
                          />
                        </span>
                        <div>
                          <div className={cn("text-lg font-semibold leading-none", isActive ? "text-primary-foreground" : "text-foreground")}>
                            {option.ratio}
                          </div>
                          <div className={cn("mt-1 text-sm", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {option.orientation}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frame-count">{advancedOptions?.frameCount?.label || "Clip Length"}</Label>
              <div className="flex flex-col gap-3 sm:flex-row" id="frame-count">
                {frameCountOptions.map((option) => {
                  const isActive = option.value === frameCount;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onFrameCountChange(option.value)}
                      className={cn(
                        "flex h-full w-full flex-col justify-center rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-1",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-lg"
                          : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
                      )}
                    >
                      <span className={cn("text-base font-semibold", isActive ? "text-primary-foreground" : "text-foreground")}>
                        {option.label}
                      </span>
                      {option.helper && (
                        <span className={cn("mt-1 text-xs", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {option.helper}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Switch
              id="remove-watermark"
              checked={removeWatermark}
              onCheckedChange={onRemoveWatermarkChange}
            />
            <Label htmlFor="remove-watermark" className="cursor-pointer">
              {advancedOptions?.removeWatermark?.label || "Remove Watermark"}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
