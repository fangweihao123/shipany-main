export type GenerationMode = "t2i" | "i2i" | "i2v";

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface GenerationAsset {
  id?: string;
  sourceUrl?: string;
  mimeType?: string;
  r2Url?: string;
  r2Key?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerationResultPayload {
  assets?: GenerationAsset[];
  rawResponse?: unknown;
}
