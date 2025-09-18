import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function getVideoPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function queryTaskStatus(id:string):Promise<any>{
  const response = await fetch('/api/watermark/wavespeed/query',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id}),
  });
  if(!response.ok){
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("query result", result);
  return result;
}

export async function pollTaskResult(id: string): Promise<any>{
  const maxAttempts = 30;
  const interval = 2000;

  for(let attempt = 0; attempt < maxAttempts; attempt++){
    const status = await queryTaskStatus(id);
    if(status.data.status === 'completed'){
      return status;
    }
    if(status.data.status === 'failed'){
      throw new Error('unwatermark failed');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Detection timeout');
}
