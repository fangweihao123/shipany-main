import { deviceTrialUsage } from "@/db/schema";
import { getIsoTimestr } from "@/lib/time";
import { deviceTrialUsageProps, findDeviceTrialUsage, insertDeviceTrialUsage, updateDeviceTrialUsage } from "@/models/deviceTrialUsage";
import { TrialTaskMaxAttempts } from "./constant";
import { TaskProvider } from "@/types/task";

export async function canUseTrialService(
  {
    fingerPrint: fingerPrint,
    ip: ip,
    task_code: task_code
  } : deviceTrialUsageProps
)
{
  const usage = await findDeviceTrialUsage({fingerPrint, ip, task_code});
  const MaxAttempts : number = TrialTaskMaxAttempts[task_code];
  if(usage){
    if(usage.attempts_used < MaxAttempts){
      return true;
    }
  }else{
    return true;
  }
  console.log(`${fingerPrint} | ${ip} No valid taskTrialConfig for ${task_code}`);
  return false;
}

export async function increaseTaskTrialUsage({
    fingerPrint,
    ip,
    task_code,
    times
} : {
  fingerPrint : string
  ip : string
  task_code : TaskProvider
  times : number
})
{
  const usage = await findDeviceTrialUsage({fingerPrint, ip, task_code});
  if(usage){
    usage.attempts_used += times;
    usage.last_used_at = new Date(getIsoTimestr());
    const updatedUsage = await updateDeviceTrialUsage(usage);
  }else{
    const newUsage: typeof deviceTrialUsage.$inferInsert = {
      web_fingerprint: fingerPrint,
      ip_address: ip,
      task_code: task_code,
      attempts_used: 1,
      first_used_at: new Date(getIsoTimestr()),
      last_used_at: new Date(getIsoTimestr()),
    }
    const usage = await insertDeviceTrialUsage(newUsage);
  }
}