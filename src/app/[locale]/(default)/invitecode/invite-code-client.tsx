"use client";

import { useEffect, useState } from "react";
import type { InviteCode, InviteCodePage } from "@/types/pages/invitecode";
import { InviteUploader } from "./components/invite-uploader";
import { InviteCard } from "./components/invite-card";
import { InstructionsPanel } from "./components/instructions-panel";
import {
  fetchInviteCodes,
  mapApiItemToInviteCode,
  REFRESH_INTERVAL,
  submitInviteCode,
  voteOnInviteCode,
} from "@/services/invitecode/invitecode.reactive";
import { formatTemplate } from "./utils";

export default function InviteCodeListPageClient({
  copy,
}: {
  copy: InviteCodePage["invitecode"];
}) {
  const [items, setItems] = useState<InviteCode[]>([]);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const controllers = new Set<AbortController>();

    const load = async () => {
      const controller = new AbortController();
      controllers.add(controller);
      if (!cancelled) {
        setNextRefreshAt(Date.now() + REFRESH_INTERVAL);
      }
      try {
        const data = await fetchInviteCodes(controller.signal);
        if (!cancelled) {
          const next = data.map(mapApiItemToInviteCode);
          setItems(next);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("invite code fetch failed", error);
        }
      } finally {
        controllers.delete(controller);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      controllers.forEach((ctrl) => ctrl.abort());
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!nextRefreshAt) {
      setCountdown(0);
      return;
    }
    const tick = () => {
      setCountdown(Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextRefreshAt]);

  async function onUpload(code: string) {
    const created = await submitInviteCode(code);
    const newInvite = mapApiItemToInviteCode(created);
    setItems((prev) => {
      const filtered = prev.filter((item) => item.code !== newInvite.code);
      return [newInvite, ...filtered];
    });

    try {
      const data = await fetchInviteCodes();
      setItems(data.map(mapApiItemToInviteCode));
    } catch (error) {
      console.warn("refresh invite codes after submit failed", error);
    }
  }

  async function onVote(id: InviteCode["id"], dir: 1 | -1) {
    const current = items.find((item) => item.id === id);
    if (!current) {
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              upvotes: (item.upvotes || 0) + (dir === 1 ? 1 : 0),
              downvotes: (item.downvotes || 0) + (dir === -1 ? 1 : 0),
            }
          : item
      )
    );

    try {
      await voteOnInviteCode(current.code, dir === 1);
    } catch (error) {
      console.warn("vote invite code failed", error);
      if (error instanceof Error && error.message === "invite_code_vote_duplicate") {
        alert(copy.list.limitNotice);
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? current : item))
      );
      return;
    }

    try {
      const data = await fetchInviteCodes();
      setItems(data.map(mapApiItemToInviteCode));
    } catch (error) {
      console.warn("refresh invite codes after vote failed", error);
    }
  }

  async function onReport(id: InviteCode["id"]) {
    alert(copy.list.reportAlert);
  }

  const refreshLabel = nextRefreshAt
    ? formatTemplate(copy.list.refresh.label, {
        time: new Date(nextRefreshAt).toLocaleTimeString([], { hour12: false }),
        seconds: countdown.toString(),
      })
    : copy.list.refresh.loading;

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
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          {copy.list.limitNotice}
        </p>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {refreshLabel}
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
        </div>

        <InstructionsPanel instructions={copy.list.instructions} />
      </div>
    </main>
  );
}
