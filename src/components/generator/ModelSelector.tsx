import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import type { ModelSelectorCopy } from "@/types/blocks/imagegenerator";

type GeneratorMode = "i2i" | "t2i" | "t2v" | "i2v";

interface ModelSelectorProps {
  mode: GeneratorMode;
  copy?: ModelSelectorCopy;
  value: "standard" | "pro";
  onChange: (value: "standard" | "pro") => void;
}

export function ModelSelector({ mode, copy, value, onChange }: ModelSelectorProps) {
  if ((mode !== "t2v" && mode !== "i2v") || !copy) {
    return null;
  }

  const { label, standard, pro, description, proTag } = copy;

  const options: Array<{ key: "standard" | "pro"; text: string }> = [
    { key: "standard", text: standard || "Sora 2" },
    { key: "pro", text: pro || "Sora 2 Pro" },
  ];

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        {options.map(({ key, text }) => {
          const isActive = value === key;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(key)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:flex-1",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-lg"
                  : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
              )}
            >
              <span className="text-base font-semibold">
                {text}
              </span>
              {key === "pro" && proTag && (
                <span
                  className={cn(
                    "ml-3 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                    isActive
                      ? "border-primary-foreground text-primary-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {proTag}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
