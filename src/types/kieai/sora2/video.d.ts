export interface GenerateVideoRequest {
    model: string;
    callBackUrl?: string;
    input: {
      prompt: string;
      image_urls?: string[];
      aspect_ratio?: string;
      n_frames?: number;
      remove_watermark?: boolean;
    }
}

export interface GenerateVideoResponse{
  id: string;
}
