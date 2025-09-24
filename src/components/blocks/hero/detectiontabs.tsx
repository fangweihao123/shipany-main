"use client";
import { useMemo, useState } from "react";
import DetectMusicInline from "@/components/detect/detmusicinline";
import DetectTextInline from "@/components/detect/detextinline";
import DetectInline from "@/components/detect/deimginline";
import { Detection, DetectResult, State } from "@/types/blocks/detect";
import Icon from "@/components/icon";

export default function DetectionTabs({ detection, state, detectResult }: { detection: Detection, state: State, detectResult: DetectResult}){
  const uploads = useMemo(() => detection?.uploads ?? [], [detection]);
  const [activeIndex, setActiveIndex] = useState(0);

  const DetectionTypeSelector = () => {
    switch(uploads[activeIndex].type){
      case "detecttext":
        return (
          <DetectTextInline _upload={uploads[activeIndex]} _state={state} _detectResult={detectResult}/>
        );
      case "detectaudio":
        return (
          <DetectMusicInline _upload={uploads[activeIndex]} _state={state} _detectResult={detectResult} max_audio_length={30} />
        );
      case "detectimage":
        return (
          <DetectInline _upload={uploads[activeIndex]} _state={state} _detectResult={detectResult}/>
        );
    }
    return (<div></div>);
  };
  
  return (
    <div id="detect" className="container">
        {/* Tab Navigation */}
        {uploads.length > 1 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border p-1">
              {uploads.map((u, i) => (
                <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2 rounded-md flex items-center ${activeIndex === i? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon name={u.icon as string} className="size-6"/>
                  {u.upload_tab || u.upload_title}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Detection Area */}
        <section id="detect-area" className="mt-6 scroll-mt-24">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5 sm:p-6">
            {DetectionTypeSelector()}
          </div>
        </section>
      </div>
  );
}
