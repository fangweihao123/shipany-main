export interface GenerateVideoRequest {
    prompt: string;
    image: string;
    aspect_ratio?: "16:9" | "9:16";
    duration?: number;
    resolution?: "720p" | "1080p";
    generate_audio?: boolean;
    negative_prompt?: string;
    seed?: number;
}

export interface GenerateVideoResponse {
  id: string;
  model: string;
  outputs: [];
  status: string;
}