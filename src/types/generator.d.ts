// AI Image Detection Types

// API Provider Types
export type GeneratorProvider = 'nanobananat2i' | 'nanobananai2i' | 'nanobananai2v' | 'sora2t2v' | 'sora2i2v';

export interface GeneratorOutput {
  id?: string;
  src: string;
  mimeType?: string;
}
