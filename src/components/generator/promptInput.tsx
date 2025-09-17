"use client";
import { PromptInput } from "@/types/blocks/base";
import { Textarea } from "../ui/textarea";
import { useCallback, useState } from "react";

interface PromptInputProps {
  promptInput?: PromptInput;
  onChange?: (content: string) => void;
}

export function PromptInputBlock({ promptInput, onChange }: PromptInputProps) {
  const [value, setValue] = useState("");

  const handleTextChange = useCallback((value: string) => {
    setValue(value);
    onChange?.(value);
  }, []);

  return (
    <div className="m-4">
      <h2 className="text-foreground text-lg mb-2">{promptInput?.title}</h2>
      <Textarea 
        className="border-4 h-[12rem]" 
        placeholder={promptInput?.textPlaceHolder}
        onChange={(e) => handleTextChange(e.target.value)}
        >
      </Textarea>
    </div>
  );
}