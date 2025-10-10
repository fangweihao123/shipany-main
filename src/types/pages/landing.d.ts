import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { Pricing } from "@/types/blocks/pricing";
import { Detection } from "@/types/blocks/detect"
import { HeroGeometic } from "@/types/blocks/heroGeometic";
import { ImageGenerator } from "@/types/blocks/imagegenerator";

export interface LandingPage {
  header?: Header;
  hero?: Hero;
  heroGeometic?: HeroGeometic;
  detection?: Detection;
  imageGenerator?: ImageGenerator;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  feature?: Section;
  showcase?: Section;
  showcase1?: Section;
  stats?: Section;
  pricing?: Pricing;
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
  footer?: Footer;
}

export interface PricingPage {
  pricing?: Pricing;
}

export interface ShowcasePage {
  showcase?: Section;
}

export interface DetectPage {
}
