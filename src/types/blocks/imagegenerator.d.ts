import { PromptInput, Button, DataCard } from "./base"
import { Upload } from "./detect";

export interface Text2Image{
  input?: PromptInput;
}

export interface Image2Image{
  upload?: Upload;
  input?: PromptInput;
}

export interface PromptEngine{
  title?: string;
  description?: string;
  image2ImageTab?: string;
  image2Image?: Image2Image;
  text2ImageTab?: string;
  text2Image?: Text2Image;
  generateButton?: Button;
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
