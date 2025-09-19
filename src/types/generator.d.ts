// AI Image Detection Types

// API Provider Types
export type GeneratorProvider = 'nanobananat2i' | 'nanobananai2i';

export interface GeneratorOutput {
  id?: string;
  src: string;
  mimeType?: string;
}
