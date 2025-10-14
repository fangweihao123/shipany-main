import { deviceTrialUsage } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and, or } from "drizzle-orm";
import { TaskProvider } from "@/types/task";

export interface deviceTrialUsageProps{
  fingerPrint: string,
  ip: string,
  task_code: TaskProvider
}

export async function insertDeviceTrialUsage(
  data: typeof deviceTrialUsage.$inferInsert
): Promise<typeof deviceTrialUsage.$inferSelect | undefined> {
  const [trialUsage] = await db().insert(deviceTrialUsage).values(data).returning();
  return trialUsage;
}

export async function updateDeviceTrialUsage(
  data: typeof deviceTrialUsage.$inferInsert
): Promise<typeof deviceTrialUsage.$inferSelect | undefined> {
  const [trialUsage] = await db()
    .update(deviceTrialUsage)
    .set({attempts_used: data.attempts_used, last_used_at: data.last_used_at})
    .where(eq(deviceTrialUsage.web_fingerprint, data.web_fingerprint))
    .returning();
  return trialUsage;
}

export async function findDeviceTrialUsage(
  {
    fingerPrint: fingerPrint,
    ip: ip,
    task_code: task_code
  } : deviceTrialUsageProps
): Promise<typeof deviceTrialUsage.$inferSelect | undefined> {
  const [trialUsage] = await db()
    .select()
    .from(deviceTrialUsage)
    .where(and(or(eq(deviceTrialUsage.web_fingerprint, fingerPrint),
              eq(deviceTrialUsage.ip_address, ip)),
            eq(deviceTrialUsage.task_code, task_code)) 
          )
    .limit(1);

  return trialUsage;
}
