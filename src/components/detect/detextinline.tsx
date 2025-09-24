"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, CheckCircle, XCircle, RefreshCw, Info, AlertTriangle, Shield } from 'lucide-react';
import {
  DetectionState,
  TextInputState,
  DetectionQueryRequest,
  DetectionTextQueryResponse
} from '@/types/detect';
import {
  detectText,
  validateTextState,
  pollDetectionResult
} from '@/services/detect';
import { Upload as DetectUpload, State, DetectResult } from "@/types/blocks/detect";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { useTrial } from '@/lib/trial';
import { useTextTrial } from '@/lib/texttrial';

export default function DetectTextInline({ _upload, _state, _detectResult }: { _upload?: DetectUpload, _state?: State, _detectResult?: DetectResult }) {
  const { status } = useSession();
  const router = useRouter();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const [textState, setTextState] = useState<TextInputState>({
    text: '',
    isValid: false,
    error: null,
    wordCount: 0,
  });


  const [detectionState, setDetectionState] = useState<DetectionState>({
    isLoading: false,
    isUploading: false,
    isDetecting: false,
    isFinished: false,
    result: null,
    error: null,
    uploadProgress: 0,
    provider: 'undetectabletext',
  });

  const handleTextChange = useCallback((value: string) => {
    const newTextState = validateTextState(value);
    setTextState(newTextState);
    // Reset detection state when text changes
    if (detectionState.result || detectionState.error) {
      
      setDetectionState(prev => ({
        ...prev,
        result: null,
        error: null,
        isFinished: false,
      }));
    }
  }, [detectionState.result, detectionState.error]);


  const handleDetection = useCallback(async () => {
    if (!textState.text.trim()) return;

    // Require auth before detection
    if (status === 'unauthenticated') {
      if(!useTextTrial(textState.wordCount)){
        setShowAuthDialog(true);
        setTimeout(() => router.push('/auth/signin'), 1200);
        return;
      }
    }else{
      // Check credits before detection
      try {
        const creditsResponse = await fetch('/api/get-user-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const creditsData = await creditsResponse.json();
        const credits = Math.ceil(textState.wordCount * 0.01);
        
        if (creditsData.message !== "ok" || creditsData.data?.left_credits < credits) {
          setDetectionState(prev => ({
            ...prev,
            isLoading: false,
            isUploading: false,
            isDetecting: false,
            isFinished: false,
            error: _detectResult?.insufficient_credits ?? 'Insufficient credits. Please upgrade your plan.',
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
    }

    setDetectionState(prev => ({
      ...prev,
      isUploading: true,
      isDetecting: false,
      isFinished: false,
      error: null,
    }));

    try {
      const result = await detectText(textState.text, "undetectabletext");
      setDetectionState(prev => ({
        ...prev,
        isUploading: false,
        isDetecting: true,
        isFinished: false,
        result: result,
        error: null,
      }));
      
      const request: DetectionQueryRequest = {
        type: "",
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
  }, [textState.text, textState.isValid, status, router, _detectResult]);

  const handleReset = useCallback(() => {
    setTextState({
      text: '',
      isValid: false,
      error: null,
      wordCount: 0,
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
    <div className="space-y-8">
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogDescription>
            {_state?.auth_required || ''}
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Input Section */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label htmlFor="text-input">{_upload?.upload_title || 'Enter text'}</Label>
              <Textarea
                id="text-input"
                placeholder={_upload?.text_input_placeholder || 'Enter text here (minimum 200 words recommended for best accuracy)...'}
                value={textState.text}
                onChange={(e) => handleTextChange(e.target.value)}
                className="min-h-[120px] max-h-[200px] resize-y"
                disabled={detectionState.isUploading || detectionState.isDetecting}
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {_upload?.word_count?.replace('{count}', textState.wordCount.toString()) || `${textState.wordCount} words`}
                </span>
                {textState.wordCount < 200 && textState.text.trim() && (
                  <span className="text-orange-600">
                    {_upload?.min_words_tip || 'Minimum 200 words recommended for best accuracy'}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detection Button */}
        {textState.text.trim() && (
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
                 detectionState.isDetecting ? _state?.analyzing ?? "Analyzing..." : _state?.processing ?? "Processing..."}
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
        {(textState.error || detectionState.error) && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {textState.error || detectionState.error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {detectionState.isFinished && detectionState.result ? (
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {detectionState.result.result > 50 ? (
                    <AlertTriangle className="w-16 h-16 text-red-600" />
                  ) : (
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  )}
                </div>
                <CardTitle className={`text-2xl ${detectionState.result.result > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {detectionState.result.result > 50 ? 
                    (_detectResult?.ai_generated?.split(':')[0] ?? 'AI Generated') : 
                    (_detectResult?.human_created?.split(':')[0] ?? 'Human Created')
                  }
                </CardTitle>
                <CardDescription>
                  {_detectResult?.confidence_level ?? 'Overall confidence'}: {Math.round(detectionState.result.result)}%
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Overall Confidence Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {_detectResult?.confidence_level ?? "Overall Confidence"}
                    </span>
                    <Badge variant={detectionState.result.result > 50 ? "destructive" : "default"}>
                      {Math.round(detectionState.result.result)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={detectionState.result.result} 
                    className="h-3"
                  />
                </div>

                {/* Individual Detection Scores */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">{_detectResult?.individual_detection_scores ?? 'Individual Detection Scores'}</h4>
                  <div className="grid gap-2 text-sm">
                    {detectionState.result.result_details && (
                      <>
                        <div className="flex justify-between items-center p-2 bg-background rounded border">
                          <span className="font-medium">{_detectResult?.human_score ?? 'Human Score'}</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {Math.round(detectionState.result.result_details.human)}%
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Interpretation Guide */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {detectionState.result.result > 50 ? (
                      <span>
                        <strong>{_detectResult?.ai_generated ?? "AI Generated: This text appears to have been created by artificial intelligence."}</strong> 
                        {_detectResult?.ai_pattern_detected ?? 'The majority of detection models agree that this content shows patterns typical of AI-generated text.'}
                      </span>
                    ) : (
                      <span>
                        <strong>{_detectResult?.human_created ?? "Human Created: This text appears to be authentic or human-written."}</strong> 
                        {_detectResult?.human_pattern_detected ?? 'The analysis suggests this content shows patterns more consistent with human writing.'}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {_detectResult?.analyze_again ?? 'Analyze Another Text'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{_detectResult?.understand ?? "Understanding the Results"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>
                  {_detectResult?.confidence_score_desc ?? "Overall Score: This represents the combined analysis from multiple AI detection models. Scores above 50% suggest AI-generated content."}
                </p>
                <p>
                  {_detectResult?.ai_generated_desc ?? "Individual Scores: Each detection model uses different algorithms to analyze text patterns, writing style, and linguistic markers typical of AI-generated content."}
                </p>
                <p>
                  {_detectResult?.human_created_desc ?? "Human Score: Represents the likelihood that the text was written by a human, based on natural writing patterns and stylistic elements."}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  {_detectResult?.note ?? "Note: No detection method is 100% accurate. Results should be considered alongside other evidence when making important decisions about content authenticity."}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {_detectResult?.result_detail ?? "Detection results will appear here"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}