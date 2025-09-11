"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image as ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  UnwatermarkState,
  FileUploadState,
  UnwatermarkProvider,
} from '@/types/unwatermark';
import {
  unwatermarkImage,
  validateFile,
  getSupportFileType,
  formatFileSize,
  getDefaultProvider,
  pollTaskResult
} from '@/services/unwatermark';

import { getImagePreview } from '@/lib/utils';

import { FileUpload } from '@/components/blocks/upload';
import { Upload as DetectUpload, State, UnwatermarkResult } from "@/types/blocks/unwatermarklocale";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { ShowImageResult } from './ShowImgresult';

export default function RemoveBGBlock({ _upload, _state, _unwatermarkDetails }: { _upload?: DetectUpload, _state?: State, _unwatermarkDetails?: UnwatermarkResult }) {
  const { status } = useSession();
  const router = useRouter();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const apiProvider : UnwatermarkProvider = "wavespeedremovebg";
  const [formats, scope] = getSupportFileType(apiProvider);

  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    preview: null,
    isValid: false,
    error: null,
  });

  const [unwatermarkState, setUnwatermarkState] = useState<UnwatermarkState>({
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
    setUnwatermarkState(prev => ({
      ...prev,
      isUploading: false,
      isDetecting: false,
      isFinished: false,
      result: null,
      error: null,
      uploadProgress: 0,
    }));

    // Validate file
    const validation = validateFile(file, apiProvider);
    if (!validation.isValid) {
      setFileState({
        file: null,
        preview: null,
        isValid: false,
        error: validation.error || (_unwatermarkDetails?.invalid_file ?? 'Invalid file'),
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
        error: _unwatermarkDetails?.preview_failed ?? 'Failed to generate image preview',
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

    setUnwatermarkState(prev => ({
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
        setUnwatermarkState(prev => ({
          ...prev,
          isLoading: false,
          isUploading: false,
          isDetecting: false,
          isFinished: false,
          error: _unwatermarkDetails?.insufficient_credits ?? 'Insufficient credits. You need at least 1 credit for detection. Please upgrade your plan.',
        }));
        return;
      }
    } catch (error) {
      setUnwatermarkState(prev => ({
        ...prev,
        isLoading: false,
        isUploading: false,
        isDetecting: false,
        isFinished: false,
        error: _unwatermarkDetails?.unable_verify_credits ?? 'Unable to verify credits. Please try again.',
      }));
      return;
    }

    try {
      const result = await unwatermarkImage(fileState.file, apiProvider);
      setUnwatermarkState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: true,
        isFinished: false,
        result: result,
        error: null,
        taskId: result,
      }));
      const queryResult = await pollTaskResult(result);
      setUnwatermarkState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        isFinished: true,
        result: queryResult,
        error: null,
      }));
    } catch (error) {
      setUnwatermarkState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        result: null,
        error: error instanceof Error ? error.message : (_unwatermarkDetails?.unwatermark_failed ?? 'Unwatermark failed'),
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
    setUnwatermarkState(prev => ({
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
            isLoading={unwatermarkState.isUploading}
            upload={_upload}
            supportType={formats}
            filescope={scope}
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
            disabled={unwatermarkState.isUploading || unwatermarkState.isDetecting}
            className="w-full"
            size="lg"
            >
            {unwatermarkState.isUploading || unwatermarkState.isDetecting ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {unwatermarkState.isUploading ? _state?.uploading ?? "Uploading...": 
                 unwatermarkState.isDetecting ? _state?.analyzing ?? "Analyzing..." : _state?.processing ?? "Processsing..."}
                </>
            ) : unwatermarkState.isFinished ? (
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
        {(fileState.error || unwatermarkState.error) && (
            <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
                {fileState.error || unwatermarkState.error}
            </AlertDescription>
            </Alert>
        )}
        </div>

        {/* Results Section */}
        {
          unwatermarkState.isFinished ? (
            <ShowImageResult 
            result={unwatermarkState.result.data.outputs}
            unwatermarkDetails={_unwatermarkDetails}
            imagePreview={fileState.preview}
            onReset={handleReset}
            />
          ) : (
            <div className="space-y-6">
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        {_unwatermarkDetails?.result_detail ?? "Detection results will be here"}
                    </p>
                    </div>
                </CardContent>
              </Card>
            </div>
          )
        }
        
    </div>
  );
}
