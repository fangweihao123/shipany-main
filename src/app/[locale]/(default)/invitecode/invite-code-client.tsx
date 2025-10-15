"use client";

import { useEffect, useState } from "react";
import type { InviteCode, InviteCodePage } from "@/types/pages/invitecode";
import { InviteUploader } from "./components/invite-uploader";
import { InviteCard } from "./components/invite-card";
import { InstructionsPanel } from "./components/instructions-panel";
import {
  addInviteCodeToMockServer,
  fetchMockInviteCodes,
  getMockServerSnapshot,
  mapApiItemToInviteCode,
  recordVoteOnMockServer,
  REFRESH_INTERVAL,
} from "./components/mock-service";

export default function InviteCodeListPageClient({
  copy,
}: {
  copy: InviteCodePage["invitecode"];
}) {
  const [items, setItems] = useState<InviteCode[]>(() =>
    getMockServerSnapshot().map(mapApiItemToInviteCode)
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetchMockInviteCodes();
        if (!cancelled && res.code === 0 && Array.isArray(res.data)) {
          const next = res.data.map(mapApiItemToInviteCode);
          setItems(next);
        }
      } catch (error) {
        console.warn("mock invite code fetch failed", error);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function onUpload(code: string) {
    const newServerItem = addInviteCodeToMockServer(code);
    const newInvite = mapApiItemToInviteCode(newServerItem);
    setItems((prev) => [newInvite, ...prev]);
  }

  async function onVote(id: InviteCode["id"], dir: 1 | -1) {
    recordVoteOnMockServer(id, dir);
    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              upvotes: (x.upvotes || 0) + (dir === 1 ? 1 : 0),
              downvotes: (x.downvotes || 0) + (dir === -1 ? 1 : 0),
            }
          : x
      )
    );
  }

  async function onReport(id: InviteCode["id"]) {
    alert(copy.list.reportAlert);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 xl:max-w-6xl">
      <div className="mb-8">
        <InviteUploader copy={copy.upload} onSubmit={onUpload} />
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {copy.list.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.list.description}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.6fr)_320px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {items.map((item) => (
            <InviteCard
              key={item.id}
              item={item}
              copy={copy.list.card}
              onVote={onVote}
              onReport={onReport}
            />
          ))}

          <div className="flex justify-center pt-4">
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              onClick={() => alert(copy.list.loadMoreAlert)}
            >
              {copy.list.loadMore}
            </button>
          </div>
        </div>

        <InstructionsPanel instructions={copy.list.instructions} />
      </div>
    </main>
  );
}
