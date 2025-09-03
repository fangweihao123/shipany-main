"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  DetectionState,
  FileUploadState,
  DetectionQueryRequest,
  DetectionImageQueryResponse
} from '@/types/detect';
import {
  detectImage,
  validateFile,
  getImagePreview,
  formatFileSize,
  getDefaultProvider,
  pollDetectionResult
} from '@/services/detect';

import { DetectionImageResult } from './detimgresult';
import { FileUpload } from './upload';

export default function DetectInline() {
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    preview: null,
    isValid: false,
    error: null,
  });

  const [detectionState, setDetectionState] = useState<DetectionState>({
    isLoading: false,
    isUploading: false,
    isDetecting: false,
    isFinished: false,
    result: null,
    error: null,
    uploadProgress: 0,
    provider: getDefaultProvider(),
  });

  const handleFileSelect = useCallback(async (file: File) => {
    // Reset states
    setDetectionState(prev => ({
      ...prev,
      isLoading: false,
      isUploading: false,
      isDetecting: false,
      isFinished: false,
      result: null,
      error: null,
      uploadProgress: 0,
    }));

    // Validate file
    const validation = validateFile(file, "undetectableimg");
    if (!validation.isValid) {
      setFileState({
        file: null,
        preview: null,
        isValid: false,
        error: validation.error || 'Invalid file',
      });
      return;
    }

    try {
      // Generate preview
      const preview = await getImagePreview(file);
      setFileState({
        file,
        preview,
        isValid: true,
        error: null,
      });
    } catch (error) {
      setFileState({
        file: null,
        preview: null,
        isValid: false,
        error: 'Failed to generate image preview',
      });
    }
  }, []);

  const handleDetection = useCallback(async () => {
    if (!fileState.file || !fileState.isValid) return;

    setDetectionState(prev => ({
      ...prev,
      isLoading: true,
      isDetecting: false,
      error: null,
    }));

    try {
      const result = await detectImage(fileState.file, "undetectableimg");
      setDetectionState(prev => ({
        ...prev,
        isLoading: false,
        isDetecting: true,
        isFinished: false,
        result: result,
        error: null,
      }));
      const request : DetectionQueryRequest = {
        type: "image",
        id: result.id
      };
      const queryResult = await pollDetectionResult(request);
      setDetectionState(prev => ({
        ...prev,
        isLoading: false,
        isDetecting: false,
        isFinished: true,
        result: queryResult,
        error: null,
      }));
    } catch (error) {
      setDetectionState(prev => ({
        ...prev,
        isLoading: false,
        isDetecting: false,
        result: null,
        error: error instanceof Error ? error.message : 'Detection failed',
      }));
    }
  }, [fileState.file, fileState.isValid]);

  const handleReset = useCallback(() => {
    setFileState({
      file: null,
      preview: null,
      isValid: false,
      error: null,
    });
    setDetectionState(prev => ({
      ...prev,
      isLoading: false,
      isUploading: false,
      isDetecting: false,
      result: null,
      error: null,
      uploadProgress: 0,
    }));
  }, []);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
        <FileUpload
            onFileSelect={handleFileSelect}
            fileState={fileState}
            isLoading={detectionState.isLoading}
        />

        {/* File Info */}
        {fileState.file && fileState.isValid && (
            <Card>
            <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                    {fileState.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                    {formatFileSize(fileState.file.size)}
                    </p>
                </div>
                </div>
            </CardContent>
            </Card>
        )}

        {/* Detection Button */}
        {fileState.isValid && (
            <Button
            onClick={handleDetection}
            disabled={detectionState.isLoading}
            className="w-full"
            size="lg"
            >
            {detectionState.isLoading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {detectionState.isDetecting ? 'Detecting...' : 'Processing...'}
                </>
            ) : (
                'Detect AI Generation'
            )}
            </Button>
        )}

        {/* Error Display */}
        {(fileState.error || detectionState.error) && (
            <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
                {fileState.error || detectionState.error}
            </AlertDescription>
            </Alert>
        )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
        {detectionState.isFinished ? (
            <DetectionImageResult
            result={detectionState.result as DetectionImageQueryResponse}
            imagePreview={fileState.preview}
            onReset={handleReset}
            />
        ) : (
            <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
                <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-gray-500">
                    Detection results will appear here
                </p>
                </div>
            </CardContent>
            </Card>
        )}
        </div>
    </div>
  );
}