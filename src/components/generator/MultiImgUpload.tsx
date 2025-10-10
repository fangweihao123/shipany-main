"use client";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, Plus, X } from "lucide-react";
import { Upload } from "@/types/blocks/detect";

interface MultiImgUploadProps {
  uploadInfo?: Upload;
  maxFiles?: number;
  onChange?: (files: File[]) => void;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function MultiImgUpload({ uploadInfo, maxFiles = 9, onChange }: MultiImgUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputId = useId();

  useEffect(() => {
    onChange?.(images.map((item) => item.file));
  }, [images, onChange]);

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [images]);

  const filesLeft = useMemo(() => Math.max(maxFiles - images.length, 0), [images.length, maxFiles]);
  const isAtLimit = filesLeft === 0;

  const handleFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;

      const filtered = incoming.filter((file) => file.type.startsWith("image/"));
      if (!filtered.length) {
        setError("Please choose image");
        return;
      }

      if (isAtLimit) {
        setError(`Can only upload max ${maxFiles} images`);
        return;
      }

      const accepted = filtered.slice(0, filesLeft);
      const nextItems = accepted.map((file) => ({
        id: createId(),
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...nextItems]);

      if (filtered.length > filesLeft) {
        setError(`Can only upload max ${maxFiles} images`);
      } else {
        setError(null);
      }
    },
    [filesLeft, isAtLimit, maxFiles]
  );

  const handleSelect: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const fileList = event.target.files;
    if (!fileList) return;

    handleFiles(Array.from(fileList));
    event.target.value = "";
  };

  const handleDrop: React.DragEventHandler<HTMLLabelElement> = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleDragOver: React.DragEventHandler<HTMLLabelElement> = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave: React.DragEventHandler<HTMLLabelElement> = (event) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
    setError(null);
  };

  return (
    <div className="mx-4 space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-5 text-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          {uploadInfo?.upload_title}{" "}
          <span className="text-sm text-muted-foreground">
            {images.length}/{maxFiles}
          </span>
        </h3>
      </div>

      <div className="rounded-2xl bg-background p-4">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleSelect}
          disabled={isAtLimit}
        />

        <div className={cn(
          "grid gap-3",
          maxFiles === 1 ? "grid-cols-1" : "grid-cols-3"
        )}>
          {images.map((item) => (
            <div key={item.id} className="group relative aspect-square w-full overflow-hidden rounded-xl border bg-background">
              <img src={item.preview} alt={item.file.name} className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-xs text-white">
                <span className="truncate">{item.file.name}</span>
                <span>{Math.round(item.file.size / 1024)} KB</span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 size-7 rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                onClick={() => handleRemove(item.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}

          {!isAtLimit && (
            <label
              htmlFor={inputId}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background text-center transition-colors",
                isDragActive && "border-primary bg-primary",
                isAtLimit && "cursor-not-allowed opacity-60"
              )}
            >
              <Plus className="size-8 text-primary" />
              <p className="mt-1 text-sm font-medium text-primary">{uploadInfo?.select_tip}</p>
              <p className="text-xs text-muted-foreground">{uploadInfo?.max_file_size_tip}</p>
            </label>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
