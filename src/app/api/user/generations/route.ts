import { NextRequest, NextResponse } from "next/server";
import { getUserUuid } from "@/services/user";
import {
  listGenerationsForIdentity,
  loadGenerationTask,
} from "@/services/generation-task";

function serializeGeneration(record: Awaited<ReturnType<typeof loadGenerationTask>>) {
  if (!record) {
    return record;
  }

  return {
    id: record.id,
    taskId: record.task_id,
    userUuid: record.user_uuid,
    deviceFingerprint: record.device_fingerprint,
    prompt: record.prompt,
    mode: record.mode,
    status: record.status,
    resultAssets: record.result_assets,
    errorMessage: record.error_message,
    retryCount: record.retry_count,
    metadata: record.metadata,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const userUuid = await getUserUuid();
  const searchParams = request.nextUrl.searchParams;
  const taskIdParam = searchParams.get("taskId");

  if (!userUuid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 401,
          message: "Unauthorized",
        },
      },
      { status: 401 }
    );
  }

  if (taskIdParam) {
    const record = await loadGenerationTask(taskIdParam);

    if (!record) {
      return NextResponse.json(
        { success: true, data: null },
        { status: 200 }
      );
    }

    const belongsToUser =
      record.user_uuid === userUuid;

    if (!belongsToUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 403,
            message: "Forbidden",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeGeneration(record),
    });
  }

  const limitParam = Number(searchParams.get("limit") || 20);
  const pageParam = Number(searchParams.get("page") || 1);
  const limit = Number.isNaN(limitParam)
    ? 20
    : Math.max(1, Math.min(50, limitParam));
  const page = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);
  const offset = (page - 1) * limit;

  const rows = await listGenerationsForIdentity({
    userUuid,
    limit,
    offset,
  });

  return NextResponse.json({
    success: true,
    data: rows.map((row) =>
      serializeGeneration(row)
    ),
    pagination: {
      limit,
      page,
      hasMore: rows.length === limit,
    },
  });
}
