import Feature1 from "@/components/blocks/feature1";
import { getPage } from "@/services/page";
import { InviteCodePage } from "@/types/pages/invitecode";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import InviteCodeListPageClient from "./invite-code-client";

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
  const canonicalPath = locale === "en" ? "/invitecode" : `/${locale}/invitecode`;
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const defaultKeywords = t("metadata.keywords")
    ?.split(",")
    .map((item: string) => item.trim())
    .filter(Boolean);

  return {
    title: seo?.title ?? t("metadata.title"),
    description: seo?.description ?? t("metadata.description"),
    keywords: seo?.keywords ?? (defaultKeywords?.length ? defaultKeywords : ["sora2 invite code"]),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo?.title ?? t("metadata.title"),
      description: seo?.description ?? t("metadata.description"),
      url: canonicalUrl,
    },
    twitter: {
      title: seo?.title ?? t("metadata.title"),
      description: seo?.description ?? t("metadata.description"),
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
  const { heroSection, supportingSections, articleParagraphs, keywordSection } =
    content;

  return (
    <>
      <InviteCodeListPageClient copy={content} />
      {heroSection && <Feature1 section={heroSection} />}
      {supportingSections?.map((section, index) => (
        <Feature1
          key={section.name ?? `section-${index}`}
          section={section}
        />
      ))}
    </>
  );
}
