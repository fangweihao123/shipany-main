"use client";
import { useMemo, useState } from "react";
import { Image, FileText } from "lucide-react";
import UnwatermarkBlock from "@/components/unwatermark/unwatermarkblock";
import { Unwatermark } from "@/types/blocks/unwatermarklocale";
import RemoveBGBlock from "@/components/unwatermark/removebgblock";

export default function UnwatermarkTabs({ unwatermark }: { unwatermark: Unwatermark }){
  const uploads = useMemo(() => unwatermark?.uploads ?? [], [unwatermark]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <div id="unwatermark" className="container">
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
                    <Image className="w-4 h-4 mr-2" />
                  ) : (
                    <Image className="w-4 h-4 mr-2" />
                  )}
                  {u.upload_tab || u.upload_title}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Detection Area */}
        <section id="unwatermark-area" className="mt-6 scroll-mt-24">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5 sm:p-6">
            {activeIndex === 0 ? (
              <UnwatermarkBlock _upload={uploads[activeIndex]} _state={unwatermark.state} _unwatermarkDetails={unwatermark.unwatermarkResult} />
            ) : (
              <RemoveBGBlock _upload={uploads[activeIndex]} _state={unwatermark.state} _unwatermarkDetails={unwatermark.unwatermarkResult} />
            )}
          </div>
        </section>
      </div>
  );
}
