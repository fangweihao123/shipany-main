import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Showcase1 from "@/components/blocks/showcase1";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import DetectionTabs from "@/components/blocks/hero/detectiontabs";
import { getLandingPage, getPage } from "@/services/page";
import { setRequestLocale } from "next-intl/server";
import HeroGeometic from "@/components/blocks/HeroGeometric";
import { ImageGeneratorBlock } from "@/components/generator/imagegenerator";
import { NanoEditorPage } from "@/types/pages/nanoeditor";

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

async function getNanoEditorPage(locale: string): Promise<NanoEditorPage> {
  return (await getPage("nanoeditor", locale)) as NanoEditorPage;
}

export default async function NanoEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getNanoEditorPage(locale);

  return (
    <>
      {page.imageGenerator && <ImageGeneratorBlock imageGenerator={page.imageGenerator} /> }
      {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
    </>
  );
}
