import { db } from "@/db";
import { userGenerations } from "@/db/schema";
import type { GenerationAsset, GenerationMode, GenerationStatus } from "@/types/generation";
import { desc, eq, inArray, sql } from "drizzle-orm";

type UserGenerationInsert = typeof userGenerations.$inferInsert;
type UserGenerationSelect = typeof userGenerations.$inferSelect;

export interface CreateUserGenerationInput {
  taskId: string;
  prompt: string;
  mode: GenerationMode;
  userUuid?: string | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createUserGeneration(
  input: CreateUserGenerationInput
): Promise<UserGenerationSelect | undefined> {
  const now = new Date();
  const payload: UserGenerationInsert = {
    task_id: input.taskId,
    prompt: input.prompt,
    mode: input.mode,
    user_uuid: input.userUuid ?? null,
    device_fingerprint: input.deviceFingerprint ?? null,
    status: "pending",
    metadata: input.metadata ?? null,
    created_at: now,
    updated_at: now,
  };

  const [record] = await db()
    .insert(userGenerations)
    .values(payload)
    .onConflictDoUpdate({
      target: userGenerations.task_id,
      set: {
        prompt: payload.prompt,
        mode: payload.mode,
        user_uuid: payload.user_uuid,
        device_fingerprint: payload.device_fingerprint,
        metadata: payload.metadata,
        updated_at: now,
      },
    })
    .returning();

  return record;
}

export interface UpdateUserGenerationInput {
  status?: GenerationStatus;
  resultAssets?: GenerationAsset[] | null;
  errorMessage?: string | null;
  retryCountIncrement?: number;
  metadata?: Record<string, unknown> | null;
}

export async function updateUserGenerationByTaskId(
  taskId: string,
  input: UpdateUserGenerationInput
): Promise<UserGenerationSelect | undefined> {
  const now = new Date();
  const updatePayload: Record<string, unknown> = {
    updated_at: now,
  };

  if (input.status) {
    updatePayload.status = input.status;
  }

  if (input.resultAssets !== undefined) {
    updatePayload.result_assets = input.resultAssets;
  }

  if (input.errorMessage !== undefined) {
    updatePayload.error_message = input.errorMessage;
  }

  if (input.metadata !== undefined) {
    updatePayload.metadata = input.metadata;
  }

  if (input.retryCountIncrement) {
    updatePayload.retry_count = sql<number>`(${userGenerations.retry_count}) + ${input.retryCountIncrement}`;
  }

  const [record] = await db()
    .update(userGenerations)
    .set(updatePayload as Partial<UserGenerationInsert>)
    .where(eq(userGenerations.task_id, taskId))
    .returning();

  return record;
}

export async function findUserGenerationByTaskId(
  taskId: string
): Promise<UserGenerationSelect | undefined> {
  const [record] = await db()
    .select()
    .from(userGenerations)
    .where(eq(userGenerations.task_id, taskId))
    .limit(1);

  return record;
}

export async function listUserGenerationsByIdentity(options: {
  userUuid: string;
  limit?: number;
  offset?: number;
}): Promise<UserGenerationSelect[]> {
  const { userUuid, limit = 20, offset = 0 } = options;

  const rows = await db()
    .select()
    .from(userGenerations)
    .where(eq(userGenerations.user_uuid, userUuid))
    .orderBy(desc(userGenerations.created_at))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getPendingUserGenerations(
  limit: number = 20
): Promise<UserGenerationSelect[]> {
  const rows = await db()
    .select()
    .from(userGenerations)
    .where(
      inArray(userGenerations.status, ["pending", "processing"] as GenerationStatus[])
    )
    .orderBy(userGenerations.created_at)
    .limit(limit);

  return rows;
}
