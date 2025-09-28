import { NextRequest, NextResponse } from 'next/server';
import { newStorage } from '@/lib/storage';
import {
  R2PresignedUrlRequest,
  R2PresignedUrlResponse
} from '@/lib/utils';
import { ApiErrorResponse } from '@/types/detect';
import { getUserUuid } from '@/services/user';

const projectName = process.env?.NEXT_PUBLIC_PROJECT_NAME;

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated (optional based on your auth requirements)
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            message: 'Authentication required',
          },
        } as ApiErrorResponse,
        { status: 401 }
      );
    }

    const body: R2PresignedUrlRequest = await request.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType || !fileSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Missing required fields: filename, contentType, fileSize',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate file type
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
      'image/heic', 'image/avif', 'image/bmp', 'image/tiff'
    ];
    
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Unsupported file type',
            details: `Supported types: ${supportedTypes.join(', ')}`,
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Validate file size (1KB - 50MB for detection)
    if (fileSize < 1024 || fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Invalid file size',
            details: 'File size must be between 1KB and 50MB',
          },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    const storage = newStorage();
    
    // Generate unique key with timestamp and user ID
    const timestamp = Date.now();
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    const key = `${projectName}/${userUuid}/${timestamp}-${filename}`;

    const presignedData = await storage.generatePresignedUrl({
      key,
      contentType,
      expiresIn: 900, // 15 minutes
    });

    const response: R2PresignedUrlResponse = {
      success: true,
      uploadUrl: presignedData.url,
      key: presignedData.key,
      publicUrl: presignedData.publicUrl,
      expiresAt: presignedData.expiresAt,
      headers: presignedData.headers,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Failed to generate presigned URL',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      } as ApiErrorResponse,
      { status: 500 }
    );
  }
}