import { Brand, Social, Nav, Agreement } from "@/types/blocks/base";

export interface Badge {
  url: string;
  src: string;
  alt: string;
  height?: number;
}

export interface Footer {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  copyright?: string;
  social?: Social;
  agreement?: Agreement;
  badges?: Badge[];
}
