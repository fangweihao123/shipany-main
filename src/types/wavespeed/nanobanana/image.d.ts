export interface GenerateImgRequest {
    prompt: string;
    output_format?: string;
    enable_base64_output?: boolean;
    enable_sync_mode?: boolean;
}

export interface EditImgRequest {
    prompt: string;
    images: string[];
    output_format?: string;
    enable_base64_output?: boolean;
    enable_sync_mode?: boolean;
}

export interface GenerateImgResponse{
  id: string;
  model: string;
  outputs: [];
  status: string;
}