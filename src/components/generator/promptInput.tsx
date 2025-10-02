"use client";
import { PromptInput } from "@/types/blocks/base";
import { Textarea } from "../ui/textarea";

interface PromptInputProps {
  promptInput?: PromptInput;
}

export function PromptInputBlock({ promptInput }: PromptInputProps) {
  return (
    <div className="m-4">
      <h2 className="text-foreground text-lg mb-2">{promptInput?.title}</h2>
      <Textarea className="border-4 h-[12rem]" placeholder={promptInput?.textPlaceHolder}>
      </Textarea>
    </div>
  );
}