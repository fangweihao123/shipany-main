"use client";
import { useState } from "react";
import DetectImageInline from "@/components/detect/deimginline";
import DetectMusicInline from "@/components/detect/detmusicinline";
import { Scan, Volume2 } from "lucide-react";

export default function DetectionTabs(){
  const [activeTab, setActiveTab] = useState<'image' | 'music'>('image');

  return (
    <>
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border p-1">
            <button onClick={() =>
                setActiveTab('image')
            }
              className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'image'? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Scan className="w-4 h-4 mr-2" />
                Image Detection
            </button>
            <button
              onClick={() => 
                setActiveTab('music')
              }
              className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'music' ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Audio Detection
            </button>
          </div>
        </div>

        {/* Detection Area */}
        <section id="detect-area" className="mt-6 scroll-mt-24">
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-5 sm:p-6">
            {activeTab === 'image' ? <DetectImageInline /> : <DetectMusicInline />}
          </div>
        </section>
      </>
  );
}