import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Showcase from "@/components/blocks/showcase";
import { getLandingPage, getPage } from "@/services/page";
import { setRequestLocale } from "next-intl/server";
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

export default async function NanoImageEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getNanoEditorPage(locale);

  return (
    <>
      <h1 className="mx-auto mb-10 mt-4 flex text-4xl justify-center font-bold text-primary">
        { page.title ? page.title : "Nano Banana Image Editing" }
      </h1>
      {page.imageGenerator && <ImageGeneratorBlock imageGenerator={page.imageGenerator} /> }
      {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.showcase && <Showcase section={page.showcase} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
