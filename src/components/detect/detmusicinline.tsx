"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Music, Volume2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  DetectionState,
  FileUploadState,
  DetectionAudioQueryResponse,
  DetectionQueryRequest
} from '@/types/detect';
import {
  detectMusic,
  validateFile,
  getImagePreview,
  formatFileSize,
  getDefaultProvider,
  pollDetectionResult,
} from '@/services/detect';

import { DetectionAudioResult } from './detmusicresult';
import { FileUpload } from './upload';

export default function DetectMusicInline() {
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
    const validation = validateFile(file, "undetectablemp3");
    if (!validation.isValid) {
      setFileState({
        file: null,
        preview: null,
        isValid: false,
        error: validation.error || 'Invalid file',
      });
      return;
    }

    setFileState({
      file: file,
      preview: null,
      isValid: true,
      error: ""
    });
  }, []);

  const handleDetection = useCallback(async () => {
    if (!fileState.file || !fileState.isValid) return;


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
          error: 'Insufficient credits. You need at least 1 credit for detection. Please upgrade your plan.',
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
        error: 'Unable to verify credits. Please try again.',
      }));
      return;
    }

    try {
      const result = await detectMusic(fileState.file, 'undetectablemp3');
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: true,
        isFinished: false,
        result,
        error: null,
        detectionId: result.id
      }));
      const request : DetectionQueryRequest = {
        type: "audio",
        id: result.id
      };
      const queryResult = await pollDetectionResult(request);
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: false,
        isFinished: true,
        queryResult,
        error: null,
      }));
    } catch (error) {
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
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
            title="Upload an audio file"
            hint="Select audio file"
            supportType={["mp3","wav"]}
        />

        {/* File Info */}
        {fileState.file && fileState.isValid && (
            <Card>
            <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                <Music className="h-5 w-5 text-blue-600" />
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
                {detectionState.isUploading ? 'Uploading...' : 
                 detectionState.isDetecting ? 'Analyzing...' : 'Processing...'}
                </>
            ) : detectionState.isFinished ? (
                <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Detection Complete
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
            <DetectionAudioResult
            queryresult={detectionState.result as DetectionAudioQueryResponse}
            imagePreview={fileState.preview}
            onReset={handleReset}
            />
        ) : (
            <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
                <div className="text-center">
                <Volume2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
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