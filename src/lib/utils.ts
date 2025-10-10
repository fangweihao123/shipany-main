import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApiErrorResponse } from "@/types/detect";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// R2 Presigned URL Types - moved from detect.d.ts for reusability
export interface R2PresignedUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface R2PresignedUrlResponse {
  success: boolean;
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
}

// Detection with R2 URL Types - moved from detect.d.ts for reusability
export interface R2DetectionRequest {
  fileUrl: string;
  provider?: string;
  filename: string;
  contentType: string;
}

// Custom error class for file operations
export class FileOperationError extends Error {
  constructor(
    message: string,
    public code: number = 500,
    public details?: string
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
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
  const response = await fetch('/api/wavespeed/query',{
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

export async function pollKieTaskResult(id: string): Promise<any>{
  const maxAttempts = 100;
  const interval = 2000;

  for(let attempt = 0; attempt < maxAttempts; attempt++){
    const status = await queryKieTaskStatus(id);
    if(status.data.state === 'success'){
      return status;
    }
    if(status.data.state === 'fail'){
      throw new Error(`Sora2 Generation failed ${status.data.failMsg || ''}`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Sora2 timeout');
}

export async function queryKieTaskStatus(id:string):Promise<any>{
  const response = await fetch('/api/kieai/query',{
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

// R2 File Upload Functions - moved from detect.ts for reusability

/**
 * Get presigned URL for R2 file upload
 * @param file File to upload
 * @returns Promise with presigned URL data
 */
export async function getPresignedUrl(file: File): Promise<R2PresignedUrlResponse> {
  const request: R2PresignedUrlRequest = {
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
  };

  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json() as ApiErrorResponse;
    throw new FileOperationError(
      errorData.error.message,
      errorData.error.code,
      errorData.error.details
    );
  }

  return response.json() as Promise<R2PresignedUrlResponse>;
}

/**
 * Upload file to R2 using presigned URL
 * @param file File to upload
 * @param presignedData Presigned URL data from getPresignedUrl
 */
export async function uploadToR2(file: File, presignedData: R2PresignedUrlResponse): Promise<void> {
  const response = await fetch(presignedData.uploadUrl, {
    method: 'PUT',
    headers: presignedData.headers,
    body: file,
  });

  if (!response.ok) {
    throw new FileOperationError(
      `Failed to upload file to R2: ${response.statusText}`,
      response.status
    );
  }
}

/**
 * Complete R2 upload flow: get presigned URL and upload file
 * @param file File to upload
 * @returns Promise with upload result containing public URL
 */
export async function uploadFileToR2(file: File): Promise<{ publicUrl: string; key: string }> {
  // Step 1: Get presigned URL
  const presignedData = await getPresignedUrl(file);
  
  // Step 2: Upload file to R2
  await uploadToR2(file, presignedData);
  
  // Return public URL and key for further use
  return {
    publicUrl: presignedData.publicUrl,
    key: presignedData.key
  };
}
