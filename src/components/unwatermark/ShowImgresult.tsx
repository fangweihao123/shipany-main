"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UnwatermarkResult } from '@/types/blocks/unwatermarklocale';
import { 
  CheckCircle, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageResultProps {
  result: [];
  unwatermarkDetails : UnwatermarkResult | undefined;
  imagePreview: string | null;
  onReset: () => void;
}

export function ShowImageResult({ result, unwatermarkDetails, imagePreview, onReset }: ImageResultProps) {
  const resultColor = 'text-green-600';

  const ResultIcon = CheckCircle;  // AlertTriangle CheckCircle : Info;

  const onDownloadClick = async ()=>{
    if(result.length > 0){
      const url = result.at(0) ?? "";
      const res = await fetch(url, { credentials: 'omit' }); // 如果需要带 cookie，改为 'include'
      if (!res.ok) {
        alert('下载失败');
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `img_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <ResultIcon className={`w-16 h-16 ${resultColor}`} />
          </div>
          <CardDescription className="text-lg">
            {unwatermarkDetails?.resulthints ?? "Unwatermark result"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Image Preview */}
          {result.length > 0 && (
            <div className="text-center">
              <img
                src={result.at(0)}
                alt="Analyzed image"
                className="max-h-100 max-w-full rounded-lg shadow-md mx-auto"
              />
            </div>
          )}

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-center items-center">
              <span className="text-lg font-medium text-gray-700">
                 {unwatermarkDetails?.downloadtips ?? "Please download file within 7 days"}
              </span>
            </div>
            <div className="flex justify-center">
              <Button
                size="default"
                className="h-12"
                onClick={onDownloadClick}
              >
                {unwatermarkDetails?.downloadButton ?? "Download"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}