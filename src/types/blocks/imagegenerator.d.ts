import { PromptInput, Button, DataCard, Tip } from "./base"
import { Upload } from "./detect";

export interface AdvancedOptions {
  title?: string;
  outputFormat?: {
    label?: string;
    png?: string;
    jpeg?: string;
  };
  aspectRatio?: {
    label?: string;
    landscape?: string;
    portrait?: string;
  };
  resolution?: {
    label?: string;
  };
  duration?: {
    label?: string;
  };
  generateAudio?: {
    label?: string;
  };
  negativePrompt?: {
    label?: string;
    placeholder?: string;
  };
  seed?: {
    label?: string;
    placeholder?: string;
  };
}

export interface Text2Image{
  input?: PromptInput;
  advancedOptions?: AdvancedOptions;
}

export interface Text2Video{
  input?: PromptInput;
  advancedOptions?: AdvancedOptions;
}

export interface Image2Image{
  upload?: Upload;
  input?: PromptInput;
  advancedOptions?: AdvancedOptions;
}

export interface Image2Video{
  upload?: Upload;
  input?: PromptInput;
  advancedOptions?: AdvancedOptions;
}

export interface PromptEngine{
  title?: string;
  description?: string;
  image2ImageTab?: string;
  image2Image?: Image2Image;
  image2ImageCredits?: Tip;
  text2ImageTab?: string;
  text2Image?: Text2Image;
  text2ImageCredits?: Tip;
  text2VideoTab?: string;
  text2Video?: Text2Video;
  text2VideoCredits?: Tip;
  image2VideoTab?: string;
  image2Video?: Image2Video;
  image2VideoCredits?: Tip;
  generateButton?: Button;
  requireProTips?: string;
  auth_Required?: string;
  insufficient_credits?: string;
  api_error?: string;
  states?: {
    generating?: string;
  };
}

export interface OutputGallery{
  title?: string;
  description?: string;
  dataCard?: DataCard;
  downloadButton?: Button;
  messages?: {
    loading?: string;
    empty?: string;
    imageAlt?: string;
  };
}

export interface ImageGenerator{
  promptEngine?: PromptEngine;
  outputGallery?: OutputGallery;
}
