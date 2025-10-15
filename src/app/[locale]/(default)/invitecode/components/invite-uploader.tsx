"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import type { InviteCodePage } from "@/types/pages/invitecode";
import { formatTemplate } from "../utils";

const SEGMENT_COUNT = 6;

export function InviteUploader({
  copy,
  onSubmit,
}: {
  copy: InviteCodePage["invitecode"]["upload"];
  onSubmit: (code: string) => Promise<void> | void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(SEGMENT_COUNT).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const normalize = (value: string) =>
    value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1).toUpperCase();

  const updateDigit = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value;
    setDigits(next);
  };

  const handleChange = (idx: number, raw: string) => {
    const value = normalize(raw);
    updateDigit(idx, value);
    if (value && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Backspace" && !digits[idx] && inputsRef.current[idx - 1]) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (evt.key === "ArrowLeft" && inputsRef.current[idx - 1]) {
      inputsRef.current[idx - 1]?.focus();
      evt.preventDefault();
    }
    if (evt.key === "ArrowRight" && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1]?.focus();
      evt.preventDefault();
    }
  };

  const handlePaste = (idx: number, evt: ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault();
    const text = evt.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, SEGMENT_COUNT);
    if (!text) return;
    const next = [...digits];
    for (let i = 0; i < text.length && idx + i < next.length; i += 1) {
      next[idx + i] = text[i];
    }
    setDigits(next);
    const lastIndex = Math.min(
      idx + text.length - 1,
      inputsRef.current.length - 1
    );
    inputsRef.current[lastIndex]?.focus();
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (digits.some((digit) => !digit.trim())) {
      setError(copy.errorIncomplete);
      return;
    }
    const code = digits.join("");
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(code);
      setDigits(Array(SEGMENT_COUNT).fill(""));
      inputsRef.current[0]?.focus();
      alert(formatTemplate(copy.successMessage, { code }));
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : copy.errorIncomplete;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? copy.submitting : copy.submit}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            value={digit}
            onChange={(evt) => handleChange(idx, evt.target.value)}
            onKeyDown={(evt) => handleKeyDown(idx, evt)}
            onPaste={(evt) => handlePaste(idx, evt)}
            inputMode="text"
            maxLength={1}
            className="h-14 w-14 rounded-2xl border border-border bg-background text-center text-xl font-bold uppercase tracking-wide text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="_"
            aria-label={formatTemplate(copy.digitAria, { index: String(idx + 1) })}
          />
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </form>
  );
}
