import Empty from "@/components/blocks/empty";
import Copy from "@/components/blocks/table/copy";
import TableSlot from "@/components/console/slots/table";
import Icon from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { resolveAssetDisplayInfo } from "@/lib/assets";
import { listGenerationsForIdentity } from "@/services/generation-task";
import { getUserUuid } from "@/services/user";
import type { GenerationAsset } from "@/types/generation";
import { Table as TableSlotType } from "@/types/slots/table";
import { getTranslations } from "next-intl/server";
import moment from "moment";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface CreationRow {
  taskId: string;
  model: string;
  status: string;
  statusLabel: string;
  statusVariant: BadgeVariant;
  mediaUrl: string;
  isVideo: boolean;
  createdAt: Date | string | null;
  raw: Record<string, unknown>;
}

const statusVariantMap: Record<string, BadgeVariant> = {
  completed: "default",
  failed: "destructive",
  processing: "secondary",
  pending: "outline",
};

const defaultModelMap: Record<string, string> = {
  t2i: "google/nano-banana/text-to-image",
  i2i: "google/nano-banana/image-to-image",
  i2v: "google/nano-banana/image-to-video",
};

const PLACEHOLDER_THUMBNAIL = "/nano-banana-icon.svg";

export default async function MyCreationsPage() {
  const t = await getTranslations();
  const userUuid = await getUserUuid();

  if (!userUuid) {
    return <Empty message="no auth" />;
  }

  const generations = await listGenerationsForIdentity({
    userUuid,
    limit: 100,
    status: "completed",
  });

  const publicBase = (() => {
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
    if (!base) return "";
    return base.endsWith("/") ? base.slice(0, -1) : base;
  })();

  const rows: CreationRow[] = generations.map((generation) => {
    const metadata = (generation.metadata ?? {}) as Record<string, unknown>;
    const assets = (generation.result_assets ?? []) as Array<GenerationAsset>;
    const firstAsset = assets[0];
    const assetInfo = resolveAssetDisplayInfo(firstAsset, publicBase);
    const mediaUrl = assetInfo.mediaUrl;

    const status = generation.status ?? "pending";
    const statusLabel =
      t(`my_creations.status.${status}` as any) ?? String(status);
    const statusVariant = statusVariantMap[status] ?? "outline";

    const metadataModel =
      (metadata.model as string | undefined) ??
      (metadata.provider as string | undefined);
    const model =
      metadataModel ??
      defaultModelMap[generation.mode as string] ??
      generation.mode ??
      "--";

    return {
      taskId: generation.task_id,
      model,
      status,
      statusLabel,
      statusVariant,
      mediaUrl,
      isVideo: assetInfo.isVideo,
      createdAt: generation.created_at ?? generation.updated_at ?? null,
      raw: {
        ...generation,
        metadata,
        firstAsset,
      },
    };
  });

  const table: TableSlotType = {
    title: t("my_creations.title"),
    description: t("my_creations.description"),
    columns: [
      {
        title: t("my_creations.table.id"),
        name: "taskId",
        callback: (row: CreationRow) => (
          <Copy text={row.taskId}>
            <span className="font-mono text-xs text-primary underline-offset-4 hover:underline">
              {row.taskId}
            </span>
          </Copy>
        ),
      },
      {
        title: t("my_creations.table.model"),
        name: "model",
        callback: (row: CreationRow) => (
          <span className="text-sm text-muted-foreground">{row.model}</span>
        ),
      },
      {
        title: t("my_creations.table.status"),
        name: "status",
        callback: (row: CreationRow) => (
          <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
        ),
      },
      {
        title: t("my_creations.table.output"),
        name: "mediaUrl",
        callback: (row: CreationRow) =>
          row.mediaUrl ? (
            row.isVideo ? (
              <video
                src={row.mediaUrl}
                className="h-16 w-16 rounded-lg object-cover shadow"
                playsInline
                muted
                preload="metadata"
                controls
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={row.mediaUrl || PLACEHOLDER_THUMBNAIL}
                alt={row.taskId}
                className="h-16 w-16 rounded-lg object-cover shadow"
              />
            )
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          ),
      },
      {
        title: t("my_creations.table.created"),
        name: "createdAt",
        callback: (row: CreationRow) =>
          row.createdAt
            ? moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss [GMT]Z")
            : "--",
      },
      {
        title: t("my_creations.table.actions"),
        name: "actions",
        callback: (row: CreationRow) => {
          const hasOutput = row.status === "completed" && !!row.mediaUrl;
          const actionClass = cn(
            "text-lg transition-colors hover:text-primary",
            !hasOutput && "pointer-events-none opacity-40"
          );

          return (
            <div className="flex items-center gap-3 text-muted-foreground">
              <a
                href={hasOutput ? row.mediaUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
                title={t("my_creations.actions.open")}
              >
                <Icon name="RiShareBoxLine" />
              </a>
              <a
                href={hasOutput ? row.mediaUrl : undefined}
                download
                className={actionClass}
                title={t("my_creations.actions.download")}
              >
                <Icon name="RiDownloadLine" />
              </a>
            </div>
          );
        },
      },
    ],
    data: rows,
    empty_message: t("my_creations.empty"),
  };

  return <TableSlot {...table} />;
}
