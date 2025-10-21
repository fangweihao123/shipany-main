import {
  createUserGeneration,
  findUserGenerationByTaskId,
  getPendingUserGenerations,
  listUserGenerationsByIdentity,
  updateUserGenerationByTaskId,
} from "@/models/userGeneration";
import type {
  GenerationAsset,
  GenerationMode,
  GenerationStatus,
} from "@/types/generation";

export interface LogGenerationTaskInput {
  taskId: string;
  prompt: string;
  mode: GenerationMode;
  userUuid?: string | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logGenerationTask(input: LogGenerationTaskInput) {
  return createUserGeneration(input);
}

export interface UpdateGenerationTaskInput {
  status?: GenerationStatus;
  assets?: GenerationAsset[] | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  retryIncrement?: number;
}

export async function updateGenerationTask(
  taskId: string,
  input: UpdateGenerationTaskInput
) {
  return updateUserGenerationByTaskId(taskId, {
    status: input.status,
    resultAssets: input.assets,
    errorMessage: input.errorMessage,
    metadata: input.metadata,
    retryCountIncrement: input.retryIncrement,
  });
}

export async function loadGenerationTask(taskId: string) {
  return findUserGenerationByTaskId(taskId);
}

export async function listGenerationsForIdentity(options: {
  userUuid: string;
  limit?: number;
  offset?: number;
}) {
  return listUserGenerationsByIdentity(options);
}

export async function listPendingGenerationTasks(limit: number = 20) {
  return getPendingUserGenerations(limit);
}
