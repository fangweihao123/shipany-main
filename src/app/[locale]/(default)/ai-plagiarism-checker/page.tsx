import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAIPlagiarismPage } from "@/services/page";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import DetectTextInline from "@/components/detect/detextinline";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Prefer page-specific metadata from local i18n JSON
  const page: any = await import(`@/i18n/pages/ai-plagiarism-checker/${locale === "zh-CN" ? "zh" : locale}.json`).then(m => m.default).catch(async () => {
    return await import("@/i18n/pages/ai-plagiarism-checker/en.json").then(m => m.default);
  });

  const meta = page?.metadata;
  const base = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
  const canonical = `${base}/${locale}/ai-plagiarism-checker`;
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

export default async function AIPlagiarismCheckerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getAIPlagiarismPage(locale);

  return (
    <div className="min-h-screen">
      {/* Main Detection Section - Text first */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">
              {page.intro?.title || "AI Plagiarism Checker"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              {page.intro?.description || "Detect AI-written text with confidence using our advanced models."}
            </p>
          </div>
          
          {/* Detection Component (Text) */}
          <div className="max-w-6xl mx-auto mb-12">
            <DetectTextInline
              _upload={page.detection?.uploads?.[0]}
              _state={page.detection?.state}
              _detectResult={page.detection?.detectResult}
            />
          </div>

          {page.main && (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{page.main.title}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                {page.main.description}
              </p>
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-muted-foreground mb-4">
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

      {/* Intro Features */}
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

      {/* Features Section */}
      {page.feature && <Feature section={page.feature} />}

      {/* Usage Section */}
      {page.usage && <Feature section={page.usage} />}

      {/* Benefits Section */}
      {page.benefit && <Feature section={page.benefit} />}

      {/* FAQ Section */}
      {page.faq && <FAQ section={page.faq} />}
    </div>
  );
}
