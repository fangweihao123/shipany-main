import Feature1 from "@/components/blocks/feature1";
import { getPage } from "@/services/page";
import { InviteCodePage } from "@/types/pages/invitecode";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import InviteCodeListPageClient from "./invite-code-client";
import Feature from "@/components/blocks/feature";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";

async function getInviteCodePage(locale: string): Promise<InviteCodePage> {
  return (await getPage("invitecode", locale)) as InviteCodePage;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations();
  const page = await getInviteCodePage(locale);
  const seo = page.invitecode.seo;

  const baseUrl =
    process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ?? "https://sora2.ai";
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }
  canonicalUrl += "invitecode";

  return {
    title: seo?.title ?? t("metadata.title"),
    description: seo?.description ?? t("metadata.description"),
    keywords: seo?.keywords ?? t("metadata.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function InviteCodePageFunc({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getInviteCodePage(locale);
  const content = page.invitecode;
  const { heroSection, supportingSections } = content;

  return (
    <>
      <InviteCodeListPageClient copy={content} />
      {heroSection && <Feature section={heroSection} />}
      {supportingSections?.map((section, index) => (
        <Feature
          key={section.name ?? `section-${index}`}
          section={section}
        />
      ))}
    </>
  );
}
