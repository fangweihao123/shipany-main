import type { InviteCode } from "@/types/pages/invitecode";

export type InviteCodeApiItem = {
  id: number;
  invite_code: string;
  voteup: number;
  votedown: number;
  created_at: string;
};

export type InviteCodeApiResponse = {
  code: number;
  message: string;
  data: InviteCodeApiItem[];
};

const now = Date.now();
const INITIAL_MOCK_SERVER_DATA: InviteCodeApiItem[] = [
  {
    id: 1,
    invite_code: "GKC4SH",
    voteup: 12,
    votedown: 5,
    created_at: new Date(now - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    invite_code: "7F3Q9L",
    voteup: 30,
    votedown: 3,
    created_at: new Date(now - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    invite_code: "BETA01",
    voteup: 3,
    votedown: 16,
    created_at: new Date(now - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    invite_code: "HELLO8",
    voteup: 11,
    votedown: 4,
    created_at: new Date(now - 15 * 60 * 1000).toISOString(),
  },
];

let mockServerData: InviteCodeApiItem[] = [...INITIAL_MOCK_SERVER_DATA];

const MOCK_FETCH_DELAY = 300;

function mutateMockServerData() {
  mockServerData = mockServerData
    .map((item) => {
      const upDelta = Math.random() < 0.35 ? 1 : 0;
      const downDelta = Math.random() < 0.15 ? 1 : 0;

      return {
        ...item,
        voteup: item.voteup + upDelta,
        votedown: item.votedown + downDelta,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function fetchMockInviteCodes(): Promise<InviteCodeApiResponse> {
  mutateMockServerData();
  await new Promise((resolve) => setTimeout(resolve, MOCK_FETCH_DELAY));
  return {
    code: 0,
    message: "ok",
    data: mockServerData.map((item) => ({ ...item })),
  };
}

export function addInviteCodeToMockServer(code: string): InviteCodeApiItem {
  const newItem: InviteCodeApiItem = {
    id: Date.now(),
    invite_code: code,
    voteup: 0,
    votedown: 0,
    created_at: new Date().toISOString(),
  };
  mockServerData = [newItem, ...mockServerData];
  return newItem;
}

export function recordVoteOnMockServer(id: InviteCode["id"], dir: 1 | -1) {
  mockServerData = mockServerData.map((item) =>
    item.id === id
      ? {
          ...item,
          voteup: dir === 1 ? item.voteup + 1 : item.voteup,
          votedown: dir === -1 ? item.votedown + 1 : item.votedown,
        }
      : item
  );
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

export const REFRESH_INTERVAL = 60_000;

export function getMockServerSnapshot(): InviteCodeApiItem[] {
  return mockServerData.map((item) => ({ ...item }));
}
