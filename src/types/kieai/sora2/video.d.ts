export interface GenerateVideoRequest {
    model: string;
    callBackUrl?: string;
    input: {
      prompt: string;
      image_urls?: string[];
      aspect_ratio?: string;
    }
}

export interface GenerateVideoResponse{
  id: string;
}