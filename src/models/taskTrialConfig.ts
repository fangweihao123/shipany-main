import { taskTrialConfig } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and } from "drizzle-orm";

export async function findTaskTrialConfig(
  task_code: string
): Promise<typeof taskTrialConfig.$inferSelect | undefined> {
  const [trialUsage] = await db()
    .select()
    .from(taskTrialConfig)
    .where(eq(taskTrialConfig.task_code, task_code))
    .limit(1);

  return trialUsage;
}
