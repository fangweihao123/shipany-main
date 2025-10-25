import Showcase from "@/components/blocks/showcase";
import Empty from "@/components/blocks/empty";
import { cn } from "@/lib/utils";
import { isVideoAsset, resolveAssetDisplayInfo } from "@/lib/assets";
import { listGenerationsForIdentity } from "@/services/generation-task";
import { getUserUuid } from "@/services/user";
import type { GenerationAsset } from "@/types/generation";
import type { Section, SectionItem } from "@/types/blocks/section";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { MyCreationPageData } from "@/types/pages/mycreation";
import { getPage } from "@/services/page";

const DEFAULT_LIMIT = 9;
const PLACEHOLDER_IMAGE = "/nano-banana-icon.svg";

async function getMyCreationPage(locale: string): Promise<MyCreationPageData> {
  return (await getPage("mycreation", locale)) as MyCreationPageData;
}

function resolvePublicBase(): string {
  const candidates = [
    process.env.STORAGE_PUBLIC_URL,
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL,
    process.env.STORAGE_DOMAIN,
    process.env.NEXT_PUBLIC_STORAGE_DOMAIN,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  ].filter(Boolean) as string[];

  if (candidates.length === 0) {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucket = process.env.STORAGE_BUCKET;
    if (endpoint && bucket) {
      candidates.push(`${endpoint.replace(/\/$/, "")}/${bucket}`);
    }
  }

  const base = candidates[0] || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export default async function MyCreationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale : string}>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getMyCreationPage(locale);
  const userUuid = await getUserUuid();

  if (!userUuid) {
    redirect("/auth/signin");
  }

  const resolvedSearch = (await searchParams) ?? {};

  const pageParam = Number((resolvedSearch.page || "1") ?? "1");
  const currentPage = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);
  const limit = DEFAULT_LIMIT;
  const offset = (currentPage - 1) * limit;

  const generationRows = await listGenerationsForIdentity({
    userUuid,
    limit: limit + 1,
    offset,
  });

  const hasNext = generationRows.length > limit;
  const entries = (hasNext ? generationRows.slice(0, limit) : generationRows).filter(
    (generation) => (generation.status ?? "pending") === "completed",
  );
  const publicBase = resolvePublicBase();

  if (entries.length === 0) {
    return <Empty message={page.my_creations.empty || "No creations found."} />;
  }

  const showcaseItems: SectionItem[] = entries.map((generation) => {
    const assets = (generation.result_assets ?? []) as GenerationAsset[];
    const firstAsset = assets[0];
    const assetInfo = resolveAssetDisplayInfo(firstAsset, publicBase);
    const mediaUrl = assetInfo.mediaUrl || "";
    const displayUrl = mediaUrl || PLACEHOLDER_IMAGE;
    const isExternal = mediaUrl.startsWith("http");
    const bVideoAsset = isVideoAsset(assets[0], mediaUrl);

    const status = generation.status ?? "pending";
    let statusLabel:string = "";
    if(status === "pending"){
      statusLabel = page.my_creations.status.pending ?? "";
    }else if(status === "completed"){
      statusLabel = page.my_creations.status.completed ?? "";
    }else if(status === "failed"){
      statusLabel = page.my_creations.status.failed ?? "";
    }else if(status === "processing"){
      statusLabel = page.my_creations.status.processing ?? "";
    }
    return {
      title: generation.prompt || generation.task_id,
      isVideo: bVideoAsset,
      image: {
        src: displayUrl,
        alt: generation.prompt || generation.task_id,
        mimeType: assetInfo.mimeType,
      },
      url: mediaUrl || undefined,
      target: isExternal ? "_blank" : undefined,
      label: statusLabel,
    };
  });

  const section: Section = {
    title: page.my_creations.title,
    description: page.my_creations.description,
    items: showcaseItems,
  };

  const hasPrev = currentPage > 1;
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <div className="space-y-8">
      <Showcase section={section} />
      <div className="container pb-16">
        <div className="flex items-center justify-between border-t pt-6">
          <span className="text-sm text-muted-foreground">
            {page.my_creations.title} ·{" "}
            {Math.min(entries.length + (currentPage - 1) * limit, offset + entries.length)}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={
                hasPrev
                  ? ({ pathname: "/my-creation", query: { page: String(prevPage) } } as any)
                  : "#"
              }
              className={cn(
                "text-sm",
                hasPrev
                  ? "text-primary hover:underline"
                  : "pointer-events-none text-muted-foreground opacity-50"
              )}
            >
              ← {page.my_creations.pagination.previous}
            </Link>
            <Link
              href={
                hasNext
                  ? ({ pathname: "/my-creation", query: { page: String(nextPage) } } as any)
                  : "#"
              }
              className={cn(
                "text-sm",
                hasNext
                  ? "text-primary hover:underline"
                  : "pointer-events-none text-muted-foreground opacity-50"
              )}
            >
              {page.my_creations.pagination.next} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
