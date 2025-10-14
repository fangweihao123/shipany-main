
export interface DeviceTrialUsage {
  id: number;
  web_fingerprint: string;
  ip_address: string;
  task_code: string;
  attempts_used?: number;
  first_used_at?: string;
  last_used_at?: string;
}

export interface TaskTrialConfig {
  id: number;
  task_code: string;
  max_attempts: number;
  period_unit: string;
  period_value?: string;
  description?: string;
  updated_at?: string;
}