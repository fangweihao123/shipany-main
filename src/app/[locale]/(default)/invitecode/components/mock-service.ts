import type { InviteCode } from "@/types/pages/invitecode";

export type InviteCodeApiItem = {
  id: number;
  invite_code: string;
  voteup: number;
  votedown: number;
  created_at: string;
};

export type InviteCodeApiResponse<T = InviteCodeApiItem[]> = {
  code: number;
  message: string;
  data: T;
};

type RequestOptions = {
  method: "POST";
  body?: Record<string, unknown>;
  signal?: AbortSignal;
};

const API_ENDPOINTS = {
  add: "/api/invite-code/add",
  query: "/api/invite-code/query",
  vote: "/api/invite-code/vote",
} as const;

async function requestInviteApi<T>(
  url: string,
  { method, body, signal }: RequestOptions
): Promise<InviteCodeApiResponse<T>> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    throw new Error(`request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as InviteCodeApiResponse<T>;
  if (payload.code !== 0) {
    throw new Error(payload.message || "request failed");
  }

  return payload;
}

export const REFRESH_INTERVAL = 60_000;

export async function fetchInviteCodes(
  signal?: AbortSignal
): Promise<InviteCodeApiItem[]> {
  const { data } = await requestInviteApi<InviteCodeApiItem[]>(API_ENDPOINTS.query, {
    method: "POST",
    signal,
  });
  return Array.isArray(data) ? data : [];
}

export async function submitInviteCode(code: string): Promise<InviteCodeApiItem> {
  const { data } = await requestInviteApi<InviteCodeApiItem>(API_ENDPOINTS.add, {
    method: "POST",
    body: { invite_code: code },
  });
  if (!data) {
    throw new Error("invalid server response");
  }
  return data;
}

export async function voteOnInviteCode(inviteCode: string, isSupport: boolean) {
  await requestInviteApi<unknown>(API_ENDPOINTS.vote, {
    method: "POST",
    body: { invite_code: inviteCode, is_support: isSupport },
  });
}

export function mapApiItemToInviteCode(item: InviteCodeApiItem): InviteCode {
  return {
    id: item.id,
    code: item.invite_code,
    upvotes: item.voteup,
    downvotes: item.votedown,
    createdAt: item.created_at,
  };
}
