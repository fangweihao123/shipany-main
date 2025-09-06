"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock,
  Shield,
  AlertTriangle,
  Info,
  CoffeeIcon
} from 'lucide-react';
import { UnifiedDetectionResponse, DetectionAudioQueryResponse } from '@/types/detect';
import { getConfidenceColor, getConfidenceDescription } from '@/services/detect';
import { DetectResult } from '@/types/blocks/detect';

interface DetectionResultProps {
  queryresult: DetectionAudioQueryResponse | null;
  detectResult: DetectResult | undefined;
  imagePreview: string | null;
  onReset: () => void;
}

export function DetectionAudioResult({ queryresult, detectResult, imagePreview, onReset }: DetectionResultProps) {
  const confidence : number = queryresult?.result ?? 0;
  const confidenceColor = getConfidenceColor(confidence);
  const isAIGenerated = confidence > 0.7 ? true : false;

  const getResultColor = () => {
    if (isAIGenerated) {
      return confidence >= 0.7 ? 'text-red-600' : 'text-orange-600';
    } else {
      return confidence >= 0.7 ? 'text-yellow-600' : 'text-green-600';
    }
  };

  const getResultIcon = () => {
    if (isAIGenerated) {
      return confidence >= 0.7 ? XCircle : AlertTriangle;
    } else {
      return confidence >= 0.7 ? CheckCircle : Info;
    }
  };

  const ResultIcon = getResultIcon();

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <ResultIcon className={`w-16 h-16 ${getResultColor()}`} />
          </div>
          <CardTitle className={`text-2xl ${getResultColor()}`}>
            {confidence}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {detectResult?.confidence_level ?? "Confidence Level"}
              </span>
            </div>
            <Progress 
              value={confidence} 
              className="h-3"
              // You might need to add custom styling for different colors
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="text-center">
              <img
                src={imagePreview}
                alt="Analyzed image"
                className="max-h-48 max-w-full rounded-lg shadow-md mx-auto"
              />
            </div>
          )}

          {/* Interpretation Guide */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isAIGenerated ? (
                <span>
                  <strong>{detectResult?.ai_generated ?? "AI Generated: This file appears to have been created by artificial intelligence."}</strong> 
                </span>
              ) : (
                <span>
                  <strong>{detectResult?.human_created ?? "Human Created: This file appears to be authentic or human-created."} </strong> 
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onReset} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              {detectResult?.analyze_again ?? "Analyze Another file"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{detectResult?.understand ?? "Understanding the Results"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            {detectResult?.confidence_score_desc ?? "Confidence Score: Indicates how certain the AI model is about its prediction. Higher scores mean more confidence in the result."}
          </p>
          <p>
            {detectResult?.ai_generated_desc ?? "AI Generated: The image shows characteristics typical of AI-generated content, such as specific artifacts, patterns, or inconsistencies."}
          </p>
          <p>
            {detectResult?.human_created_desc ?? "Human Created: The image appears to be photographed, hand-drawn, or created through traditional digital art methods."}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            {detectResult?.note ?? "Note: No detection method is 100% accurate. Results should be considered alongside other evidence when making important decisions about image authenticity."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}