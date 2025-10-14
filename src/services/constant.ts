export const CacheKey = {
  Theme: "THEME",
  InviteCode: "INVITE_CODE",
};

export const AffiliateStatus = {
  Pending: "pending",
  Completed: "completed",
};

export const AffiliateRewardPercent = {
  Invited: 0,
  Paied: 20, // 20%
};

export const AffiliateRewardAmount = {
  Invited: 0,
  Paied: 5000, // $50
};

export const TrialTaskMaxAttempts = {
  GenerateVideo: 1
} as const;

export const TaskCreditsConsumption = {
  nanobananat2i: 2,
  nanobananai2i: 2,
  nanobananai2v: 2,
  sora2i2v: 10,
  sora2t2v: 10
} as const;

export const ErrorCode = {
  InSufficientCredits: 100,
  APIError: 200,
  RunOutTrial: 300
}