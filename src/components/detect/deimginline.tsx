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
  formatFileSize,
  getDefaultProvider,
  pollDetectionResult
} from '@/services/detect';
import { getImagePreview } from '@/lib/utils';

import { DetectionImageResult } from './detimgresult';
import { FileUpload } from '../blocks/upload';
import { Upload as DetectUpload, State, DetectResult } from "@/types/blocks/detect";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';

export default function DetectInline({ _upload, _state, _detectResult }: { _upload?: DetectUpload, _state?: State, _detectResult?: DetectResult }) {
  const { status } = useSession();
  const router = useRouter();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
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
        error: validation.error || (_detectResult?.invalid_file ?? 'Invalid file'),
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
        error: _detectResult?.preview_failed ?? 'Failed to generate image preview',
      });
    }
  }, []);

  const handleDetection = useCallback(async () => {
    if (!fileState.file || !fileState.isValid) return;

    // Require auth before detection
    if (status === 'unauthenticated') {
      setShowAuthDialog(true);
      setTimeout(() => router.push('/auth/signin'), 1200);
      return;
    }

    setDetectionState(prev => ({
      ...prev,
      isUploading: true,
      isDetecting: false,
      isFinished: false,
      error: null,
    }));

    // Check credits before detection
    try {
      const creditsResponse = await fetch('/api/get-user-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const creditsData = await creditsResponse.json();
      
      if (creditsData.message !== "ok" || creditsData.data?.left_credits < 1) {
        setDetectionState(prev => ({
          ...prev,
          isLoading: false,
          isUploading: false,
          isDetecting: false,
          isFinished: false,
          error: _detectResult?.insufficient_credits ?? 'Insufficient credits. You need at least 1 credit for detection. Please upgrade your plan.',
        }));
        return;
      }
    } catch (error) {
      setDetectionState(prev => ({
        ...prev,
        isLoading: false,
        isUploading: false,
        isDetecting: false,
        isFinished: false,
        error: _detectResult?.unable_verify_credits ?? 'Unable to verify credits. Please try again.',
      }));
      return;
    }

    try {
      const result = await detectImage(fileState.file, "undetectableimg");
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
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
        isUploading: false,
        isDetecting: false,
        isFinished: true,
        result: queryResult,
        error: null,
      }));
    } catch (error) {
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        result: null,
        error: error instanceof Error ? error.message : (_detectResult?.detection_failed ?? 'Detection failed'),
      }));
    }
  }, [fileState.file, fileState.isValid, status, router, _state?.auth_required]);

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
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogDescription>
              {_state?.auth_required || ''}
            </DialogDescription>
          </DialogContent>
        </Dialog>
        {/* Upload Section */}
        <div className="space-y-6">
        <FileUpload
            onFileSelect={handleFileSelect}
            fileState={fileState}
            isLoading={detectionState.isLoading}
            upload={_upload}
        />

        {/* File Info */}
        {fileState.file && fileState.isValid && (
            <Card>
            <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                    {fileState.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
            disabled={detectionState.isUploading || detectionState.isDetecting}
            className="w-full"
            size="lg"
            >
            {detectionState.isUploading || detectionState.isDetecting ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {detectionState.isUploading ? _state?.uploading ?? "Uploading...": 
                 detectionState.isDetecting ? _state?.analyzing ?? "Analyzing..." : _state?.processing ?? "Processsing..."}
                </>
            ) : detectionState.isFinished ? (
                <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {_state?.detection_complete ?? "Detection Complete"}
                </>
            ) : (
                _state?.detect_ai_generation ?? "Detect AI Generation"
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
            detectResult={_detectResult}
            imagePreview={fileState.preview}
            onReset={handleReset}
            />
        ) : (
            <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
                <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-muted-foreground">
                    {_detectResult?.result_detail ?? "Detection results will be here"}
                </p>
                </div>
            </CardContent>
            </Card>
        )}
        </div>
    </div>
  );
}
