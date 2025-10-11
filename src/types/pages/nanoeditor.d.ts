import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { Pricing } from "@/types/blocks/pricing";
import { Detection } from "@/types/blocks/detect"
import { HeroGeometic } from "@/types/blocks/heroGeometic";
import { ImageGenerator } from "@/types/blocks/imagegenerator";

export interface NanoEditorPage {
  title?: string;
  imageGenerator?: ImageGenerator;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  showcase?: Section;
  faq?: Section;
  cta?: Section;
}
