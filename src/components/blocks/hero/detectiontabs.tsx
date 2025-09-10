"use client";
import { useMemo, useState } from "react";
import DetectMusicInline from "@/components/detect/detmusicinline";
import DetectTextInline from "@/components/detect/detextinline";
import { Volume2, FileText } from "lucide-react";
import { Detection } from "@/types/blocks/detect";
import DetectInline from "@/components/detect/deimginline";

export default function DetectionTabs({ detection }: { detection: Detection }){
  const uploads = useMemo(() => detection?.uploads ?? [], [detection]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <div id="detect" className="container">
        {/* Tab Navigation */}
        {uploads.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border p-1">
              {uploads.map((u, i) => (
                <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2 rounded-md flex items-center ${activeIndex === i? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {i === 0 ? (
                    <FileText className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {u.upload_tab || u.upload_title}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Detection Area */}
        <section id="detect-area" className="mt-6 scroll-mt-24">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5 sm:p-6">
            {activeIndex === 0 ? (
              <DetectInline _upload={uploads[activeIndex]} _state={detection.state} _detectResult={detection.detectResult} />
            ) : (
              <DetectTextInline _upload={uploads[activeIndex]} _state={detection.state} _detectResult={detection.detectResult}/>
            )}
          </div>
        </section>
      </div>
  );
}
