import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAIAudioDetectorPage } from "@/services/page";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import DetectMusicInline from "@/components/detect/detmusicinline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page: any = await import(`@/i18n/pages/ai-audio-detector/${locale === "zh-CN" ? "zh" : locale}.json`).then(m => m.default).catch(async () => {
    return await import("@/i18n/pages/ai-audio-detector/en.json").then(m => m.default);
  });

  const meta = page?.metadata;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
  const canonical = `${base}/${locale}/ai-audio-detector`;
  if (meta) {
    return {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      alternates: { canonical },
    };
  }

  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description"), keywords: t("keywords"), alternates: { canonical } };
}

export default async function AIAudioDetectorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getAIAudioDetectorPage(locale);
  const maxAudioLength = page.detection?.max_audio_length ?? 90;

  return (
    <div className="min-h-screen">
      <section className="py-16 bg-gradient-to-b from-background to-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">
              {page.intro?.title || "AI Audio Detector"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              {page.intro?.description || "Screen audio clips for synthetic signatures in minutes."}
            </p>
          </div>

          <div className="max-w-6xl mx-auto mb-12">
            <DetectMusicInline
              _upload={page.detection?.uploads?.[0]}
              _state={page.detection?.state}
              _detectResult={page.detection?.detectResult}
              max_audio_length={maxAudioLength}
            />
          </div>

          {page.main && (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{page.main.title}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                {page.main.description}
              </p>
              <div className="max-w-4xl mx-auto text-center space-y-4">
                <p className="text-muted-foreground">
                  {page.main.tech_description}
                </p>
                <p className="text-muted-foreground">
                  {page.main.use_cases}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {page.longform && page.longform.length > 0 && (
        <section className="py-16">
          <div className="container max-w-4xl space-y-10">
            {page.longform.map((section, index) => (
              <article key={index} className="space-y-4">
                {section.heading && (
                  <h2 className="text-2xl font-semibold text-foreground">
                    {section.heading}
                  </h2>
                )}
                {section.subheading && (
                  <h3 className="text-xl font-medium text-foreground">
                    {section.subheading}
                  </h3>
                )}
                {section.paragraphs?.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>
      )}

      {page.intro?.items && (
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {page.intro.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-6 rounded-lg border bg-card">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {page.feature && <Feature section={page.feature} />}
      {page.usage && <Feature section={page.usage} />}
      {page.benefit && <Feature section={page.benefit} />}
      {page.faq && <FAQ section={page.faq} />}
    </div>
  );
}
