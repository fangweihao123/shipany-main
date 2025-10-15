"use client";
import type { InviteCodePage } from "@/types/pages/invitecode";

type InstructionItem =
  InviteCodePage["invitecode"]["list"]["instructions"]["items"][number];

function renderInstructionText(step: InstructionItem) {
  if (!step.link) {
    return step.text;
  }

  const [before = "", after = ""] = step.text.split("{{link}}");

  return (
    <>
      {before}
      <a
        href={step.link.url}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary hover:underline"
      >
        {step.link.label}
      </a>
      {after}
    </>
  );
}

export function InstructionsPanel({
  instructions,
}: {
  instructions: InviteCodePage["invitecode"]["list"]["instructions"];
}) {
  return (
    <aside className="mt-6 rounded-2xl border border-border bg-background px-5 py-6 text-sm text-muted-foreground lg:mt-0">
      <h4 className="text-sm font-semibold text-foreground">
        {instructions.title}
      </h4>
      <ol className="mt-4 space-y-4">
        {instructions.items.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <span>{renderInstructionText(step)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
