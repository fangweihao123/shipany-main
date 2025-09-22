import { Section } from "@/types/blocks/section";
import { Detection } from "@/types/blocks/detect";

export interface MainSection {
  title?: string;
  description?: string;
  tech_description?: string;
  use_cases?: string;
}

export interface LongformSection {
  heading?: string;
  subheading?: string;
  paragraphs?: string[];
}

export interface DetectPage {
  detection?: Detection;
  intro?: Section;
  main?: MainSection;
  feature?: Section;
  usage?: Section;
  benefit?: Section;
  faq?: Section;
  longform?: LongformSection[];
}
