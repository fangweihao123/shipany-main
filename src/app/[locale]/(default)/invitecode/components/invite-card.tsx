"use client";

import { useMemo, useState } from "react";
import type { InviteCode, InviteCodePage } from "@/types/pages/invitecode";
import { formatSegments } from "../utils";

export function InviteCard({
  item,
  copy,
  onVote,
  onReport,
}: {
  item: InviteCode;
  copy: InviteCodePage["invitecode"]["list"]["card"];
  onVote: (id: InviteCode["id"], dir: 1 | -1) => Promise<void> | void;
  onReport: (id: InviteCode["id"]) => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "up" | "down" | "report">(null);

  const segs = useMemo(() => formatSegments(item.code), [item.code]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(item.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  };

  const vote = async (dir: 1 | -1) => {
    setBusy(dir === 1 ? "up" : "down");
    try {
      await onVote(item.id, dir);
    } finally {
      setBusy(null);
    }
  };

  const report = async () => {
    setBusy("report");
    try {
      await onReport(item.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {copy.title}
        </h3>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {segs.map((ch, i) => (
              <span
                key={i}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-card text-xl font-bold tracking-wider text-foreground shadow-sm ring-1 ring-border/70"
              >
                {ch}
              </span>
            ))}
          </div>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
          >
            📋 {copied ? copy.copied : copy.copy}
          </button>
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {copy.copyHint}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-foreground">{copy.question}</p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={() => vote(1)}
            disabled={busy !== null}
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-primary ring-1 ring-inset ring-primary/30 transition hover:bg-primary/15 disabled:opacity-60"
          >
            ✅ {copy.yes}
          </button>
          <button
            onClick={() => vote(-1)}
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-3 text-muted-foreground ring-1 ring-inset ring-border/60 transition hover:bg-muted/80 disabled:opacity-60"
          >
            🚫 {copy.no}
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={report}
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-destructive ring-1 ring-inset ring-destructive/30 transition hover:bg-destructive/15 disabled:opacity-60"
          >
            ⚠️ {copy.report}
          </button>
        </div>
      </div>
    </div>
  );
}
